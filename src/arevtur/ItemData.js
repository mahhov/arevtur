const apiConstants = require('./apiConstants');
const pobApi = require('../services/pobApi/pobApi');
const util = require('../util/util');

class ItemData {
	constructor(league, affixValueShift, queryDefenseProperties, priceShifts,
	            tradeApiItemData) {
		this.id = tradeApiItemData.id;
		this.name = tradeApiItemData.item.name;
		this.type = tradeApiItemData.item.typeLine; // e.g. 'Gold Amulet'
		this.itemLevel = tradeApiItemData.item.ilvl;
		this.rarity = tradeApiItemData.item.rarity;
		this.corrupted = tradeApiItemData.item.corrupted;
		this.mirrored = tradeApiItemData.item.duplicated;
		this.split = tradeApiItemData.item.split;
		this.influences = Object.keys(tradeApiItemData.item.influences || {});
		this.enchantMods = tradeApiItemData.item.enchantMods || [];
		this.implicitMods = tradeApiItemData.item.implicitMods || [];
		this.fracturedMods = tradeApiItemData.item.fracturedMods || [];
		this.explicitMods = tradeApiItemData.item.explicitMods || [];
		this.craftedMods = tradeApiItemData.item.craftedMods || [];
		this.pseudoMods = tradeApiItemData.item.pseudoMods || [];
		this.accountText =
			`${tradeApiItemData.listing.account.name} > ${tradeApiItemData.listing.account.lastCharacterName}`;
		this.whisper = tradeApiItemData.listing.whisper;
		// todo[medium] add a config; if enabled; do direct whisper
		this.directWhisper = tradeApiItemData.listing.whisper_token;
		this.date = tradeApiItemData.listing.indexed;
		this.note = tradeApiItemData.item.note;
		this.text = ItemData.decode64(tradeApiItemData.item.extended.text);
		this.itemClass = ItemData.typeNameFromItemText(this.text); // e.g. 'Amulet'
		this.debug = tradeApiItemData;

		// sockets
		this.sockets = (tradeApiItemData.item.sockets || []).reduce((a, v) => {
			a[v.group] = a[v.group] || [];
			a[v.group].push(v.sColour);
			return a;
		}, []);

		// affixes
		// todo[high] need to consider fractured
		let extendedExplicitMods = tradeApiItemData.item.extended.mods?.explicit || [];
		this.affixes = Object.fromEntries([['prefix', 'P'], ['suffix', 'S']].map(([prop, tier]) =>
			[prop, extendedExplicitMods.filter(mod => mod.tier[0] === tier).length]));

		// defenses
		let defenseProperties =
			[
				['ar', 'armour'],
				['ev', 'evasion'],
				['es', 'energyShield'],
			].map(
				([responseName, fullName]) => [fullName,
					tradeApiItemData.item.extended[responseName] || 0])
				.filter(([_, value]) => value);
		this.defenseProperties = defenseProperties.map(nameValue => nameValue.join(' '));

		// Eval value
		this.evalValueDetails = {
			affixes: affixValueShift,
			defenses: ItemData.evalDefensePropertiesValue(defenseProperties,
				queryDefenseProperties),
			mods: ItemData.evalValue(this.pseudoMods),
		};
		this.evalValue = Object.values(this.evalValueDetails).reduce((sum, v) => sum + v);

		// value build
		this.valueBuildPromise = pobApi.evalItem(this.text);
		this.valueBuildPromise.then(resolved => this.valueBuildPromise.resolved = resolved);

		this.valueCraftPromise = this.craftValue();
		this.valueCraftPromise.then(resolved => this.valueCraftPromise.resolved = resolved);

		this.priceDetails = {
			count: tradeApiItemData.listing.price.amount,
			currency: tradeApiItemData.listing.price.currency,
			shifts: priceShifts,
		};
		this.pricePromise = ItemData.price(league, this.priceDetails);
		// todo[medium] rm price, let users use pricePromise
		this.pricePromise.then(price => this.price = price);
	}

	static typeNameFromItemText(text) {
		return text.match(/^Item Class: (\w+)/)[1].replace(/s$/, '');
	}

	static evalDefensePropertiesValue(itemDefenseProperties, queryDefenseProperties) {
		return itemDefenseProperties
			.map(([name, value]) => value * queryDefenseProperties[name].weight)
			.reduce((sum, v) => sum + v, 0);
	}

	static evalValue(pseudoMods) {
		let pseudoSumI = pseudoMods.findIndex(mod => mod.startsWith('Sum: '));
		if (pseudoSumI === -1)
			return 0;
		let [pseudoSum] = pseudoMods.splice(pseudoSumI, 1);
		return Number(pseudoSum.substring(5));
	}

	static async price(league, {currency: currencyId, count, shifts}) {
		let currencyPrices = (await apiConstants.currencyPrices(league))[currencyId];
		if (currencyPrices)
			return currencyPrices * count +
				Object.values(shifts).reduce((sum, shift) => sum + shift, 0);
		console.warn('Missing currency', currencyId);
		return -1;
	}

	static decode64(string64) {
		return Buffer.from(string64, 'base64').toString();
	};

	async craftValue() {
		// todo[high] do extra trade requests to get uncorrupted + open affix items
		if (this.rarity === 'Unique' || this.corrupted || this.mirrored || this.split)
			return this.valueBuildPromise.then(valueBuild =>
				({value: valueBuild.value, text: 'Unmodifiable'}));

		let openAffixes = [];
		if (this.affixes.prefix < 3)
			openAffixes.push('Prefix');
		if (this.affixes.suffix < 3)
			openAffixes.push('Suffix');
		if (!openAffixes.length)
			return this.valueBuildPromise.then(valueBuild =>
				({value: valueBuild.value, text: 'No open affix'}));

		// '0.52% of ...' -> '#% of ...'
		let existingMods = [this.fracturedMods, this.explicitMods]
			.flat()
			.map(mod => mod.replaceAll(/\d+(\.\d+)?/g, '#'));

		// todo[high] consider cost of crafts

		// todo[high] consider replacing crafted mod
		if (this.craftedMods.length)
			return this.valueBuildPromise.then(valueBuild =>
				({value: valueBuild.value, text: 'Already crafted'}));

		let craftableMods = (await pobApi
			.getCraftedMods())
			// check if item has open prefix/suffix
			.filter(craftableMod => openAffixes.includes(craftableMod.type))
			// check if craft applies to item type
			.filter(craftableMod => craftableMod.types[this.itemClass])
			// add key to dedupe different tiers of similar crafts
			.map(craftableMod => {
				craftableMod.key = Object.values(craftableMod.statOrder).join();
				return craftableMod;
			});
		// find highest tier of similar crafts
		let seenCraftableMods = craftableMods.reduce((seen, craftableMod) => {
			seen[craftableMod.key] = Math.max(craftableMod.level, seen[craftableMod.key] || 0);
			return seen;
		}, {});
		craftableMods = craftableMods
			// skip lower tier crafts
			.filter(craftableMod => craftableMod.level === seenCraftableMods[craftableMod.key])
			// map to stats
			.map(craftableMod => [craftableMod[1], craftableMod[2]].filter(v => v))
			// skip stats the item already has
			.filter(craftableMod => craftableMod
				// 'Regenerate (1.8-3) ...' -> 'Regenerate # ...'
				.map(craftableStat => craftableStat.replaceAll(/\(\d+(\.\d+)?-\d+(\.\d+)?\)/g, '#'))
				.every(craftableStat => !existingMods.includes(craftableStat)));

		// skip crafts that don't benefit build
		craftableMods = await Promise.all(craftableMods.map(
			async craftableMod => {
				// todo[high] use correct slot
				let pobType = await apiConstants.typeToPobType('Amulet');
				craftableMod.eval =
					await pobApi.evalItemModSummary(pobType, craftableMod.join('\n'));
				return craftableMod;
			}));
		craftableMods = craftableMods
			.filter(craftableMod => craftableMod.eval.value)
			.sort((a, b) => b.eval.value - a.eval.value)
			.filter((craftableMod, i, a) => craftableMod.eval.value > a[0].eval.value - 1);

		if (!craftableMods.length)
			return this.valueBuildPromise.then(valueBuild =>
				({value: valueBuild.value, text: 'No craftable mods'}));

		craftableMods = await Promise.all(craftableMods.map(craftableMod =>
			pobApi.evalItemWithCraft(this.text, craftableMod)));
		let bestI = util.maxIndex(craftableMods.map(craftableMod => craftableMod.value));
		return craftableMods[bestI];
	}
}

module.exports = ItemData;

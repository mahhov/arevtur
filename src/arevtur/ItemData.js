const apiConstants = require('./apiConstants');
const pobApi = require('../services/pobApi/pobApi');
const {maxIndex} = require('../util/util');

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
		this.directWhisperToken = tradeApiItemData.listing.whisper_token;
		this.whisperText = tradeApiItemData.listing.whisper;
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

		// Weighted value
		this.weightedValueDetails = {
			affixes: affixValueShift,
			defenses: ItemData.evalDefensePropertiesValue(defenseProperties,
				queryDefenseProperties),
			mods: ItemData.weightedValue(this.pseudoMods),
		};
		this.weightedValue = Object.values(this.weightedValueDetails).reduce((sum, v) => sum + v);

		// value build
		this.buildValuePromise = pobApi.evalItem(this.text);
		this.buildValuePromise.then(resolved => this.buildValuePromise.resolved = resolved);

		this.craftValuePromise = this.craftValue();
		this.craftValuePromise.then(resolved => this.craftValuePromise.resolved = resolved);

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
		return text.match(/^Item Class: (\w+)/)?.[1].replace(/s$/, '');
	}

	static evalDefensePropertiesValue(itemDefenseProperties, queryDefenseProperties) {
		return itemDefenseProperties
			.map(([name, value]) => value * queryDefenseProperties[name].weight)
			.reduce((sum, v) => sum + v, 0);
	}

	static weightedValue(pseudoMods) {
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
			return this.buildValuePromise.then(buildValue =>
				({value: buildValue.value, text: 'Unmodifiable'}));

		let openAffixes = [];
		if (this.affixes.prefix < 3)
			openAffixes.push('Prefix');
		if (this.affixes.suffix < 3)
			openAffixes.push('Suffix');
		if (!openAffixes.length)
			return this.buildValuePromise.then(buildValue =>
				({value: buildValue.value, text: 'No open affix'}));

		// '0.52% of ...' -> '#% of ...'
		let existingMods = [this.fracturedMods, this.explicitMods]
			.flat()
			.map(mod => mod.replaceAll(/\d+(\.\d+)?/g, '#'));

		// todo[high] consider cost of crafts
		// todo[high] consider non-veiled craftable mods only

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
			return this.buildValuePromise.then(buildValue =>
				({value: buildValue.value, text: 'No craftable mods'}));

		craftableMods = await Promise.all(craftableMods.map(craftableMod =>
			pobApi.evalItemWithCraft(this.text, craftableMod)));
		let bestI = maxIndex(craftableMods.map(craftableMod => craftableMod.value));
		let bestCraftableMod = craftableMods[bestI];

		let buildValue = await this.buildValuePromise;
		return bestCraftableMod.value > buildValue.value ?
			bestCraftableMod :
			{value: buildValue.value, text: 'Existing craft is optimal'};
	}
}

module.exports = ItemData;

const apiConstants = require('./apiConstants');
const pobApi = require('../services/pobApi/pobApi');
const {maxIndex} = require('../util/util');
const pobConsts = require('../services/pobApi/pobConsts');

class ItemData {
	constructor(version2, league, affixValueShift, queryDefenseProperties, priceShifts, queryId, tradeApiItemData) {
		this.version2 = version2;
		this.league = league;
		this.affixValueShift = affixValueShift;
		this.queryDefenseProperties = queryDefenseProperties;
		this.priceShifts = priceShifts;
		this.queryId = queryId;

		this.refresh(tradeApiItemData);
	}

	refresh(tradeApiItemData) {
		this.id = tradeApiItemData.id;
		this.name = tradeApiItemData.item.name;
		this.subtype = tradeApiItemData.item.typeLine; // e.g. 'Gold Amulet'
		this.itemLevel = tradeApiItemData.item.ilvl;
		this.rarity = tradeApiItemData.item.rarity;
		this.corrupted = tradeApiItemData.item.corrupted;
		this.mirrored = tradeApiItemData.item.duplicated;
		this.split = tradeApiItemData.item.split;
		this.influences = Object.keys(tradeApiItemData.item.influences || {});
		this.enchantMods = tradeApiItemData.item.enchantMods || [];
		this.runeMods = tradeApiItemData.item.runeMods || [];
		this.implicitMods = tradeApiItemData.item.implicitMods || [];
		this.fracturedMods = tradeApiItemData.item.fracturedMods || [];
		this.explicitMods = tradeApiItemData.item.explicitMods || [];
		this.craftedMods = tradeApiItemData.item.craftedMods || [];
		this.pseudoMods = tradeApiItemData.item.pseudoMods || [];
		this.accountText =
			`${tradeApiItemData.listing.account.name} > ${tradeApiItemData.listing.account.lastCharacterName}`;
		this.directWhisperToken = tradeApiItemData.listing.whisper_token;
		this.whisperText = tradeApiItemData.listing.whisper;
		this.onlineStatus = ItemData.onlineStatus(tradeApiItemData.listing.account.online);
		this.date = tradeApiItemData.listing.indexed;
		this.note = tradeApiItemData.item.note;
		this.text = ItemData.decode64(tradeApiItemData.item.extended.text);
		this.type = ItemData.typeFromItemText(this.text); // e.g. 'Amulet'
		this.debug = tradeApiItemData;

		if (!this.text && this.version2)
			this.text = this.reconstructText(true, true);

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

		// quality
		let qualityProperty = tradeApiItemData.item.properties
			.find(property => property.name.includes('Quality'));
		let qualityNumber = Number(qualityProperty?.values[0][0].replace('%', '') || 0);
		let qualityText = qualityProperty?.name.match(/\((.*)\)/)?.[1];
		this.quality = [`${qualityNumber} quality`, qualityText].filter(v => v).join(' - ');

		// defenses
		let defenseProperties =
			[
				['ar', 'armour'],
				['ev', 'evasion'],
				['es', 'energyShield'],
			].map(([responseName, fullName]) =>
				[fullName, tradeApiItemData.item.extended[responseName] || 0]);
		defenseProperties.push([
			'block',
			Number(tradeApiItemData.item.properties
				.find(property => property.name === 'Chance to Block' || property.name === '[Block] chance')
				?.values[0][0]
				.replace('%', '') || 0),
		]);
		this.defenseProperties = defenseProperties
			.filter(([_, value]) => value)
			.map(nameValue => nameValue.join(' '));

		// weighted value
		this.weightedValueDetails = {
			affixes: this.affixValueShift,
			defenses: ItemData.evalDefensePropertiesValue(defenseProperties, this.queryDefenseProperties),
			mods: ItemData.weightedValue(this.pseudoMods),
		};
		this.weightedValue = Object.values(this.weightedValueDetails).reduce((sum, v) => sum + v);

		// build value
		this.buildValuePromise = pobApi.evalItem(this.reconstructText(false, false));
		this.buildValuePromise
			.then(resolved => this.buildValuePromise.resolved = resolved)
			.catch(() => 0);

		// todo[medium] for version2, find best rune and compare with equipped item with best rune
		this.craftValuePromise = this.version2 ? pobApi.evalItem(this.reconstructText(true, true)) : this.craftValue();
		this.craftValuePromise
			.then(resolved => this.craftValuePromise.resolved = resolved)
			.catch(() => 0);

		this.priceDetails = {
			count: tradeApiItemData.listing.price.amount,
			currency: tradeApiItemData.listing.price.currency,
			shifts: this.priceShifts,
		};
		this.pricePromise = ItemData.price(this.league, this.priceDetails);
		// todo[medium] rm price, let users use pricePromise
		this.pricePromise.then(price => this.price = price);
	}

	static typeFromItemText(text) {
		return pobConsts.itemClassToPobType[text.match(/^Item Class: ([\w ]+)/)?.[1]];
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
		let currencyPrice = (await apiConstants.currencyPrices(league))[currencyId];
		if (currencyPrice)
			return currencyPrice * count +
				Object.values(shifts).reduce((sum, shift) => sum + shift, 0);
		console.warn('Missing currency', currencyId);
		return -1;
	}

	static onlineStatus(onlineObj) {
		if (!onlineObj)
			return 'offline';
		if (onlineObj.status)
			return onlineObj.status;
		return 'online';
	}

	static decode64(string64) {
		return Buffer.from(string64 || '', 'base64').toString();
	};

	reconstructText(includeRune, includeAnoint) {
		return [
			'Item Class',
			this.subtype,
			...includeRune ? this.runeMods : [],
			...includeAnoint ?
				this.enchantMods :
				this.enchantMods.filter(mod => !mod.startsWith('Allocates ')),
			...this.implicitMods,
			...this.explicitMods,
		].join('\n');
	}

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

		// todo[high] support best annointment and its price

		let craftableMods = (await pobApi.getCraftedMods())
			// check if item has open prefix/suffix
			.filter(craftableMod => openAffixes.includes(craftableMod.type))
			// check if craft applies to item type
			.filter(craftableMod => craftableMod.types[this.type])
			.map(craftableMod => {
				// add stats as an array
				craftableMod.stats = [craftableMod[1], craftableMod[2]].filter(v => v);
				// add key to dedupe different tiers of similar crafts
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
			// skip stats the item already has
			.filter(craftableMod => craftableMod.stats
				// 'Regenerate (1.8-3) ...' -> 'Regenerate # ...'
				.map(craftableStat => craftableStat.replaceAll(/\(\d+(\.\d+)?-\d+(\.\d+)?\)/g, '#'))
				// '+1 to Minimum ...' -> '+# to Minimum ...'
				.map(craftableStat => craftableStat.replaceAll(/\d+/g, '#'))
				.every(craftableStat => !existingMods.includes(craftableStat)));

		// skip crafts that don't benefit build
		craftableMods = await Promise.all(craftableMods.map(async craftableMod => {
			// todo[medium] use correct slot; amulet won't correctly eval e.g. local evasion or dmg.
			let pobType = await apiConstants.typeToPobType('Amulet');
			craftableMod.eval =
				await pobApi.evalItemModSummary(pobType, craftableMod.stats.join('\n'));
			return craftableMod;
		}));
		// pick the best mod
		craftableMods = craftableMods
			.filter(craftableMod => craftableMod.eval.value)
			.sort((a, b) => b.eval.value - a.eval.value)
			.filter((craftableMod, i, a) => craftableMod.eval.value > a[0].eval.value - 1);

		if (!craftableMods.length)
			return this.buildValuePromise.then(buildValue =>
				({value: buildValue.value, text: 'No craftable mods'}));

		let craftableModEvals = await Promise.all(craftableMods.map(craftableMod => {
			let evalStats = craftableMod.stats;
			if (craftableMod.modTags.includes('unveiled_mod'))
				evalStats[0] += ` (veiled)`;
			return pobApi.evalItemWithCraft(this.text, evalStats);
		}));
		let bestI = maxIndex(craftableModEvals.map(craftableModEval => craftableModEval.value));
		let bestCraftableMod = craftableModEvals[bestI];

		let buildValue = await this.buildValuePromise;
		return bestCraftableMod.value > buildValue.value ?
			bestCraftableMod :
			{value: buildValue.value, text: 'Existing craft is optimal'};
	}
}

module.exports = ItemData;

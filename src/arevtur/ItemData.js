const ApiConstants = require('./ApiConstants');
const pobApi = require('../pobApi/pobApi');

class ItemData {
	// Since constructors can't be async, we use a static async creator.
	// todo make the async fields promises so we can use a constructor. But how? The item's would
	//   be hard to use without the async price and build value computed.
	static async create(league, affixValueShift, queryDefenseProperties, priceShifts,
	                    tradeApiItemData) {
		let sockets = (tradeApiItemData.item.sockets || []).reduce((a, v) => {
			a[v.group] = a[v.group] || [];
			a[v.group].push(v.sColour);
			return a;
		}, []);
		let extendedExplicitMods = tradeApiItemData.item.extended.mods?.explicit || [];
		let affixes = Object.fromEntries([['prefix', 'P'], ['suffix', 'S']].map(([prop, tier]) =>
			[prop, extendedExplicitMods.filter(mod => mod.tier[0] === tier).length]));
		let defenseProperties =
			[
				['ar', 'armour'],
				['ev', 'evasion'],
				['es', 'energyShield'],
			].map(
				([responseName, fullName]) => [fullName,
					tradeApiItemData.item.extended[responseName] || 0])
				.filter(([_, value]) => value);
		let pseudoMods = tradeApiItemData.item.pseudoMods || [];
		let evalValueDetails = {
			affixes: affixValueShift,
			defenses: ItemData.evalDefensePropertiesValue(defenseProperties,
				queryDefenseProperties),
			mods: ItemData.evalValue(pseudoMods),
		};
		let text = ItemData.decode64(tradeApiItemData.item.extended.text);
		let valueBuildPromise = pobApi.evalItem(text);
		valueBuildPromise.then(resolved => valueBuildPromise.resolved = resolved);
		let priceDetails = {
			count: tradeApiItemData.listing.price.amount,
			currency: tradeApiItemData.listing.price.currency,
			shifts: priceShifts,
		};

		let data = {
			id: tradeApiItemData.id,
			name: tradeApiItemData.item.name,
			type: tradeApiItemData.item.typeLine,
			itemLevel: tradeApiItemData.item.ilvl,
			corrupted: tradeApiItemData.item.corrupted,
			influences: Object.keys(tradeApiItemData.item.influences || {}),
			sockets,
			affixes,
			defenseProperties: defenseProperties.map(nameValue => nameValue.join(' ')),
			enchantMods: tradeApiItemData.item.enchantMods || [],
			implicitMods: tradeApiItemData.item.implicitMods || [],
			fracturedMods: tradeApiItemData.item.fracturedMods || [],
			explicitMods: tradeApiItemData.item.explicitMods || [],
			craftedMods: tradeApiItemData.item.craftedMods || [],
			pseudoMods,
			accountText:
				`${tradeApiItemData.listing.account.name} > ${tradeApiItemData.listing.account.lastCharacterName}`,
			whisper: tradeApiItemData.listing.whisper,
			// todo add a config, if enabled, do direct whisper
			directWhisper: tradeApiItemData.listing.whisper_token,
			date: tradeApiItemData.listing.indexed,
			note: tradeApiItemData.item.note,
			evalValue: Object.values(evalValueDetails).reduce((sum, v) => sum + v),
			evalValueDetails,
			price: await ItemData.price(league, priceDetails),
			priceDetails,
			valueBuildPromise,
			text,
			debug: tradeApiItemData,
		};
		let itemData = new ItemData();
		Object.assign(itemData, data);
		return itemData;
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
		let currencyPrices = (await ApiConstants.constants.currencyPrices(league))[currencyId];
		if (currencyPrices)
			return currencyPrices * count +
				Object.values(shifts).reduce((sum, shift) => sum + shift, 0);
		console.warn('Missing currency', currencyId);
		return -1;
	}

	static decode64(string64) {
		return Buffer.from(string64, 'base64').toString();
	};
}

module.exports = ItemData;

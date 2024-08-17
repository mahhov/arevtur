const poeNinjaApi = require('../services/poeNinjaApi');
const {config} = require('../services/config');
const Filter = require('./Filter');

// todo[medium] dedupe the multiple round util functions
const round = (number, decimals = 2) => {
	let factor = Math.pow(10, decimals);
	return Math.round(number * factor) / factor;
};

const price = (number, invert) => Number.isNaN(number) ? '?' :
	`${round(invert ? 1 / number : number)}${invert ? '1/c' : 'c'}`;

class TextItem {
	constructor(text) {
		// {
		// 	 text: string,
		//	 lines: [], like lastLine,
		//   lastLine: {line: string, words: string[], line split on space},
		//   itemClass: string, 1st line, without first 2 words,
		//   itemRarity: string, 2nd line without first word,
		//   itemName1: string, 3rd line,
		//   itemName2: string, 4th line,
		// }

		if (!text)
			return {error: 'blank input'};

		this.text = text;
		this.lines = text.split(/\r?\n/).filter(a => a).map(line => ({
			line,
			words: line.split(' '),
		}));
		this.lastLine = this.lines[this.lines.length - 1];
		if (this.lines.length < 2)
			return {error: 'short input'};

		this.itemClass = this.lines[0].words.slice(2).join(' ');
		this.itemRarity = this.lines[1].words.slice(1).join(' ');
		this.itemName1 = this.lines[2].line.replace(/^Superior /, '');
		this.itemName2 = this.lines[3].line.replace(/^Superior /, '');
		if (!this.itemName2.replaceAll('-', '').trim())
			this.itemName2 = this.itemName1;

		console.log(JSON.stringify({
			itemClass: this.itemClass,
			itemRarity: this.itemRarity,
			itemName1: this.itemName1,
			itemName2: this.itemName2,
		}, null, 2));
	}
}

class Pricer {
	constructor(filter, dataEndpointsByLeague) {
		this.filter = filter;
		this.dataEndpointsByLeague = dataEndpointsByLeague;
	}

	refreshData() {
		this.dataArray = this.dataEndpointsByLeague
			.map(endpointByLeague => endpointByLeague(config.config.league))
			.map(poeNinjaApi.getData)
			.map(promise => promise.catch(e => null));
	}

	async price(inputItem) {
		if (!this.filter(inputItem))
			return Promise.resolve([]);
		console.log('Running', this.dataEndpointsByLeague[0](''));
		this.refreshData();

		return (await Promise.all(this.dataArray))
			.map(response => response.lines)
			.flat()
			.filter(item => this.nameFilter(item, inputItem))
			.map(this.priceString);
	}

	nameFilter(item, inputItem) {
		return inputItem.itemName1.includes(item.name) || inputItem.itemName2.includes(item.name);
	}

	priceString(item) {
		let variantText = item.variant ? `, ${item.variant}` : '';
		return `${price(item.chaosValue)} - ${item.name}${variantText}`;
	}
}

class CurrencyPricer extends Pricer {
	constructor() {
		super(Filter.and(
			Filter.itemClass('Stackable Currency'),
			Filter.itemRarity('Currency'),
			Filter.not(Filter.name2Contains(' Rune')),
			Filter.not(Filter.name2Contains('Tattoo of the ')),
			Filter.not(Filter.name2Contains('Omen of ')),
			Filter.not(Filter.textContains(' vendor inventory.')),
			Filter.not(Filter.name2Contains(' Oil')),
			Filter.not(Filter.name2Contains(' Delirium Orb')),
			Filter.not(Filter.name2Contains(' Fossil')),
			Filter.not(Filter.textContains(' your bestiary.')),
			Filter.not(Filter.name2Contains('Essence of ')),
			Filter.not(Filter.name2Contains('Vial of ')),
		), [poeNinjaApi.endpointsByLeague.CURRENCY]);
	}

	nameFilter(item, inputItem) {
		return item.currencyTypeName === inputItem.itemName2;
	}

	priceString(item) {
		let value = item.chaosEquivalent;
		let low = 1 / item.pay?.value;
		let high = item.receive?.value;
		let invert = value < 1;
		if (invert)
			[low, high] = [high, low];
		return `${price(value, invert)} [${price(low, invert)} - ${price(high, invert)}]`;
	}
}

class FragmentPricer extends Pricer {
	constructor() {
		super(Filter.and(
			Filter.or(
				Filter.itemClass('Stackable Currency'),
				Filter.itemClass('Map Fragments'),
				Filter.itemClass('Breachstones'),
				Filter.itemClass('Vault Keys'),
			),
			Filter.or(
				Filter.itemRarity('Currency'),
				Filter.itemRarity('Normal'),
			),
			// Filter rout other 'Map Fragments'
			Filter.not(Filter.name2Contains('Scarab')),
			// Filter out other 'Stackable Currency'
			Filter.not(Filter.name2Contains(' Rune')),
			Filter.not(Filter.name2Contains('Tattoo of the ')),
			Filter.not(Filter.name2Contains('Omen of ')),
			Filter.not(Filter.textContains(' vendor inventory.')),
			Filter.not(Filter.name2Contains(' Oil')),
			Filter.not(Filter.name2Contains(' Delirium Orb')),
			Filter.not(Filter.name2Contains(' Fossil')),
			Filter.not(Filter.textContains(' your bestiary.')),
			Filter.not(Filter.name2Contains('Essence of ')),
			Filter.not(Filter.name2Contains('Vial of ')),
		), [poeNinjaApi.endpointsByLeague.FRAGMENT]);
	}

	nameFilter(item, inputItem) {
		return item.currencyTypeName === inputItem.itemName2;
	}

	priceString(item) {
		let value = item.chaosEquivalent;
		let low = 1 / item.pay?.value;
		let high = item.receive?.value;
		return `${price(value)} [${price(low)} - ${price(high)}]`;
	}
}

class KalguuranRunePricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Stackable Currency',
			itemRarity: 'Currency',
			name2Contains: ' Rune',
			textContains: ' at the Kingsmarch ',
		}), [poeNinjaApi.endpointsByLeague.KALGUURAN_RUNE]);
	}
}

class TattooPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Stackable Currency',
			itemRarity: 'Currency',
			name2Contains: 'Tattoo of the ',
			textContains: ' Maximum 50 Tattoos.',
		}), [poeNinjaApi.endpointsByLeague.TATTOO]);
	}
}

class OmensPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Stackable Currency',
			itemRarity: 'Currency',
			name2Contains: 'Omen of ',
			textContains: ' one Omen in ',
		}), [poeNinjaApi.endpointsByLeague.OMENS]);
	}
}

class DivinationCardPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Divination Cards',
			itemRarity: 'Divination Card',
			textContains: 'Stack Size: ',
		}), [poeNinjaApi.endpointsByLeague.DIVINATION_CARD]);
	}
}

class ArtifactPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Stackable Currency',
			itemRarity: 'Currency',
			textContains: ' vendor inventory.',
		}), [poeNinjaApi.endpointsByLeague.ARTIFACT]);
	}
}

class OilPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Stackable Currency',
			itemRarity: 'Currency',
			name2Contains: ' Oil',
			textContains: ' Oils at Cassia ',
		}), [poeNinjaApi.endpointsByLeague.OIL]);
	}
}

class IncubatorPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Incubators',
			itemRarity: 'Currency',
			name2Contains: ' Incubator',
			textContains: ' The Incubated item drops ',
		}), [poeNinjaApi.endpointsByLeague.INCUBATOR]);
	}
}

class UniqueWeaponArmourAccessoryPricer extends Pricer {
	constructor() {
		super(Filter.and(
			Filter.not(item => item.itemClass.includes(' Flasks')),
			Filter.not(Filter.itemClass('Jewels')),
			Filter.not(Filter.itemClass('Abyss Jewels')),
			Filter.not(Filter.itemClass('Relics')),
			Filter.not(Filter.itemClass('Maps')),
			Filter.itemRarity('Unique'),
		), [
			poeNinjaApi.endpointsByLeague.UNIQUE_WEAPON,
			poeNinjaApi.endpointsByLeague.UNIQUE_ARMOUR,
			poeNinjaApi.endpointsByLeague.UNIQUE_ACCESSORY,
		]);
	}

	priceString(item) {
		let linkedText = item.links ? `${item.links} links` : `unlinked`;
		let relicText = item.detailsId.includes('-relic') ? ', relic' : '';
		return `${super.priceString(item)}, ${linkedText}${relicText}`;
	}
}

class UniqueFlaskPricer extends Pricer {
	constructor() {
		super(Filter.and(
			item => item.itemClass.includes(' Flasks'),
			Filter.itemRarity('Unique'),
			Filter.name2Contains(' Flask'),
			Filter.textContains(' to drink. '),
		), [poeNinjaApi.endpointsByLeague.UNIQUE_FLASK]);
	}
}

class UniqueJewelPricer extends Pricer {
	constructor() {
		super(Filter.and(
			Filter.or(
				Filter.itemClass('Jewels'),
				Filter.itemClass('Abyss Jewels'),
			),
			Filter.itemRarity('Unique'),
			Filter.name2Contains(' Jewel'),
			Filter.textContains(' Jewel Socket on the Passive '),
		), [poeNinjaApi.endpointsByLeague.UNIQUE_JEWEL]);
	}
}

class UniqueRelicPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Relics',
			itemRarity: 'Unique',
			textContains: ' Relic Altar ',
		}), [poeNinjaApi.endpointsByLeague.UNIQUE_RELIC]);
	}
}

class NonVaalSkillGemPricer extends Pricer {
	constructor() {
		super(Filter.and(
			Filter.or(
				Filter.itemClass('Skill Gems'),
				Filter.itemClass('Support Gems'),
			),
			Filter.itemRarity('Gem'),
			Filter.textContains(' remove from a socket.'),
			Filter.not(Filter.textContains('Vaal ')),
		), [poeNinjaApi.endpointsByLeague.SKILL_GEM]);
	}
}

class VaalSkillGemPricer extends Pricer {
	constructor() {
		super(Filter.and(
			Filter.or(
				Filter.itemClass('Skill Gems'),
				Filter.itemClass('Support Gems'),
			),
			Filter.itemRarity('Gem'),
			Filter.textContains(' remove from a socket.'),
			Filter.textContains('Vaal '),
		), [poeNinjaApi.endpointsByLeague.SKILL_GEM]);
	}

	nameFilter(item, inputItem) {
		return item.name.startsWith('Vaal ') &&
			`Vaal ${inputItem.itemName2}`.includes(item.name) &&
			inputItem.text.includes(item.name);
	}
}

class ClusterJewelPricer extends Pricer {
	constructor() {
		super(Filter.and(
			Filter.itemClass('Jewels'),
			Filter.nonUnique(),
			Filter.name2Contains(' Cluster Jewel'),
			Filter.textContains(' Jewel Socket on the Passive '),
		), [poeNinjaApi.endpointsByLeague.CLUSTER_JEWEL]);
	}

	nameFilter(item, inputItem) {
		return inputItem.text.includes(item.name);
	}

	priceString(item) {
		return `${price(
			item.chaosValue)} - ${item.variant}, lvl ${item.levelRequired}, ${item.name}`;
	}
}

class MapPricer extends Pricer {
	constructor() {
		super(Filter.and(
			Filter.itemClass('Maps'),
			Filter.nonUnique(),
			Filter.name2Contains(' Map'),
			Filter.not(Filter.name2Contains('Blighted ')),
			Filter.not(Filter.name2Contains('Blight-ravaged ')),
			Filter.textContains(' Maps can only '),
		), [poeNinjaApi.endpointsByLeague.MAP]);
	}

	priceString(item) {
		return `${super.priceString(item)}, Tier ${item.mapTier}`;
	}
}

class BlightedMapPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Maps',
			name2Contains: 'Blighted ',
			textContains: ' Maps can only ',
		}), [poeNinjaApi.endpointsByLeague.BLIGHTED_MAP]);
	}

	priceString(item) {
		return `${super.priceString(item)}, Tier ${item.mapTier}`;
	}
}

class BlightRavagedMapPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Maps',
			name2Contains: 'Blight-ravaged ',
			textContains: ' Maps can only ',
		}), [poeNinjaApi.endpointsByLeague.BLIGHT_RAVAGED_MAP]);
	}

	priceString(item) {
		return `${super.priceString(item)}, Tier ${item.mapTier}`;
	}
}

class UniqueMapPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Maps',
			itemRarity: 'Unique',
			name2Contains: ' Map',
			textContains: ' Maps can only ',
		}), [poeNinjaApi.endpointsByLeague.UNIQUE_MAP]);
	}

	priceString(item) {
		return `${super.priceString(item)}, Tier ${item.mapTier}`;
	}
}

class DeliriumOrbPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Stackable Currency',
			itemRarity: 'Currency',
			name2Contains: ' Delirium Orb',
			textContains: ' layers of Delirium ',
		}), [poeNinjaApi.endpointsByLeague.DELIRIUM_ORB]);
	}
}

class InvitationPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Misc Map Items',
			itemRarity: 'Normal',
			name2Contains: ' Invitation',
			textContains: ' personal Map Device.',
		}), [poeNinjaApi.endpointsByLeague.INVITATION]);
	}
}

class ScarabPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Map Fragments',
			itemRarity: 'Normal',
			name2Contains: 'Scarab',
			textContains: ' personal Map Device ',
		}), [poeNinjaApi.endpointsByLeague.SCARAB]);
	}
}

class MemoryPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Memories',
			itemRarity: 'Magic',
			name2Contains: 's Memory of ',
		}), [poeNinjaApi.endpointsByLeague.MEMORY]);
	}
}

class BaseItemPricer extends Pricer {
	constructor() {
		super(Filter.and(
			Filter.nonUnique(),
			Filter.not(Filter.itemRarity('Gem')),
			Filter.or(
				Filter.textContains('Requirements:'),
				Filter.itemClass('Jewels'),
			),
			Filter.not(Filter.name2Contains(' Cluster Jewel')),
		), [poeNinjaApi.endpointsByLeague.BASE_ITEM]);
	}

	nameFilter(item, inputItem) {
		return super.nameFilter(item, inputItem) &&
			(!item.variant || inputItem.text.includes(item.variant));
	}

	priceString(item) {
		// 2.6c - bone-circlet-86-redeemer
		return `${price(item.chaosValue)} - ${item.detailsId}`;
	}
}

class FossilPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Stackable Currency',
			itemRarity: 'Currency',
			name2Contains: ' Fossil',
			textContains: ' in a Resonator ',
		}), [poeNinjaApi.endpointsByLeague.FOSSIL]);
	}
}

class ResonatorPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Delve Stackable Socketable Currency',
			itemRarity: 'Currency',
			name2Contains: ' Chaotic Resonator',
			textContains: ' Fossils before ',
		}), [poeNinjaApi.endpointsByLeague.RESONATOR]);
	}
}

class BeastPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Stackable Currency',
			textContains: ' your bestiary.',
		}), [poeNinjaApi.endpointsByLeague.BEAST]);
	}
}

class EssencePricer extends Pricer {
	constructor() {
		super(Filter.and(
			Filter.itemClass('Stackable Currency'),
			Filter.itemRarity('Currency'),
			Filter.or(
				Filter.name2Contains('Essence of '),
				Filter.name2Contains('Remnant of Corruption'),
			),
		), [poeNinjaApi.endpointsByLeague.ESSENCE]);
	}
}

class VialPricer extends Pricer {
	constructor() {
		super(Filter.all({
			itemClass: 'Stackable Currency',
			itemRarity: 'Currency',
			name2Contains: 'Vial of ',
			textContains: ' Altar of Sacrifice ',
		}), [poeNinjaApi.endpointsByLeague.VIAL]);
	}
}

let pricers = [
	new CurrencyPricer(),
	new FragmentPricer(),
	new KalguuranRunePricer(),
	new TattooPricer(),
	new OmensPricer(),
	new DivinationCardPricer(),
	new ArtifactPricer(),
	new OilPricer(),
	new IncubatorPricer(),
	new UniqueWeaponArmourAccessoryPricer(),
	new UniqueFlaskPricer(),
	new UniqueJewelPricer(),
	new UniqueRelicPricer(),
	new NonVaalSkillGemPricer(),
	new VaalSkillGemPricer(),
	new ClusterJewelPricer(),
	new MapPricer(),
	new BlightedMapPricer(),
	new BlightRavagedMapPricer(),
	new UniqueMapPricer(),
	new DeliriumOrbPricer(),
	new InvitationPricer(),
	new ScarabPricer(),
	new MemoryPricer(),
	new BaseItemPricer(),
	new FossilPricer(),
	new ResonatorPricer(),
	new BeastPricer(),
	new EssencePricer(),
	new VialPricer(),
];

let getPrice = async (text) => {
	let textItem = new TextItem(text);
	if (textItem.error)
		return [textItem.error];
	let prices = (await Promise.all(pricers.map(pricer => pricer.price(textItem)))).flat();
	return prices.length ? [
		textItem.itemName2,
		...prices,
	] : [`no prices found for ${textItem.itemName2}`];
};

module.exports = {getPrice};

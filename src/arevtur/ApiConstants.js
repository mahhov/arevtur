const {httpRequest, XPromise} = require('js-desktop-base');
const poeNinjaApi = require('../services/poeNinjaApi');

// Without a non-empty user-agent header, PoE will return 403.
let get = endpoint => httpRequest.get(endpoint, {}, {'User-Agent': '_'});

let duration3hours = 3 * 60 * 60 * 1000;
let retry = handler => {
	let lastRequest;
	let promise;
	return () => {
		if (!promise || promise.error || performance.now() - lastRequest > duration3hours) {
			lastRequest = performance.now();
			promise = new XPromise(handler());
		}
		return promise;
	};
};

class Constants {

	// leagues

	get leagues() {
		return (this.leagues_ ||= retry(Constants.initLeagues))();
	}

	static async initLeagues() {
		let response = await get('https://api.pathofexile.com/leagues');
		return JSON.parse(response.string)
			.filter(league => !league.rules.some(rule => rule.id === 'NoParties'))
			.map(league => league.id);
		/*
			['Harvest', ...]
		*/
	}

	// types

	get types() {
		return (this.types_ ||= retry(Constants.initTypes))();
	}

	static async initTypes() {
		let response = await get('https://web.poecdn.com/js/PoE/Trade/Data/Static.js');
		let str = response.string.match(/return(.*)}\)\);/)[1];
		let cleanStr = str
			.replace(/e\.translate\("(.*?)"\)/g, '"$1"')
			.replace(/([{,])(\w+):/g, '$1"$2":')
			.replace(/!(\d)/g, `"!${1}}}"`);
		let data = JSON.parse(cleanStr);
		let types = data.propertyFilters
			.find(({id}) => id === 'type_filters').filters
			.find(({id}) => id === 'category').option.options;
		types.find(({id}) => id === 'armour.chest').text += ' chest';
		return types;
		/*
			[{
				id: 'weapon.claw',
				text: 'claw',
			}, ...]
		*/
	}

	async typeTexts() {
		let types = await this.types;
		return types.map(({text}) => text);
	}

	async typeTextToId(text) {
		let types = await this.types;
		return types.find(type => type.text === text)?.id;
	}

	async typeIdToText(id) {
		let types = await this.types;
		return types.find(type => type.id === id)?.text;
	}

	// properties

	get properties() {
		return (this.properties_ ||= retry(Constants.initProperties))();
	}

	static async initProperties() {
		let response = await get('https://www.pathofexile.com/api/trade/data/stats');
		return JSON.parse(response.string).result
			.flatMap(({entries}) => entries)
			.map(({id, text, type}) => ({id, text: `${text} (${type})`, originalText: text, type}));
		/*
		[{
	      id: 'pseudo.pseudo_total_cold_resistance',
	      text: '+#% total to Cold Resistance (pseudo)',
	    }, ...]
		*/
	}

	async propertyTexts() {
		let properties = await this.properties;
		return properties.map(({text}) => text);
	}

	async propertyTextToId(text) {
		let properties = await this.properties;
		return properties.find(property => property.text === text)?.id;
	}

	async propertyById(id) {
		let properties = await this.properties;
		return properties.find(property => property.id === id);
	}

	// currencies

	static async initCurrencies(league) {
		let currencyPrices = poeNinjaApi.getData(
			poeNinjaApi.endpointsByLeague.CURRENCY(league));
		let beastPrices = poeNinjaApi.getData(poeNinjaApi.endpointsByLeague.BEAST(league));
		let staticDataStr = get('https://www.pathofexile.com/api/trade/data/static');
		currencyPrices = await currencyPrices;
		staticDataStr = await staticDataStr;
		beastPrices = await beastPrices;

		let tuples = JSON.parse(staticDataStr.string).result
			.find(({id}) => id === 'Currency').entries
			.map(({id, text}) => {
				let price = currencyPrices.lines
					.find(line => line.currencyTypeName === text)
					?.chaosEquivalent;
				return [id, price];
			});

		let currencies = Object.fromEntries(tuples);
		currencies.fuse6LinkBenchCraft = currencies['fusing'] * 1500;
		currencies.theBlackMorrigan6LinkBeastCraft = beastPrices.lines
			.find(line => line.name === 'Black Mórrigan')
			.chaosValue;
		currencies.chaos = 1;
		return currencies;
		/* {alt: .125, ...} */
	}

	currencyPrices(league) {
		this.currencyPrices_ ||= {};
		return (this.currencyPrices_[league] ||= retry(() => Constants.initCurrencies(league)))();
	}

	// items

	get items() {
		return (this.items_ ||= retry(Constants.initItems))();
	}

	static async initItems() {
		let response = await get('https://www.pathofexile.com/api/trade/data/items');
		return JSON.parse(response.string).result
			.flatMap(({entries}) => entries)
			.map(({name, text, type}) => name || text || type);
		/* ['Pledge of Hands', ...] */
	}

	async itemTexts() {
		await this.initItemsPromise;
		return this.items;
	}
}

const SHORT_PROPERTIES = {
	totalEleRes: 'pseudo.pseudo_total_elemental_resistance',
	flatLife: 'pseudo.pseudo_total_life',
};

const SORT = {
	value: {'statgroup.0': 'desc'},
	price: {price: 'asc'},
};

// From PoB src/Classes/ItemsTab.lua
// maps trade api types to pob equipment slot
// todo[medium] rename POB_SLOTS
const POB_TYPES = {
	'weapon': 'Weapon 1',
	'weapon.one': 'Weapon 1',
	'weapon.onemelee': 'Weapon 1',
	'weapon.twomelee': 'Weapon 1',
	'weapon.bow': 'Weapon 1',
	'weapon.claw': 'Weapon 1',
	'weapon.dagger': 'Weapon 1',
	'weapon.basedagger': 'Weapon 1',
	'weapon.runedagger': 'Weapon 1',
	'weapon.oneaxe': 'Weapon 1',
	'weapon.onesword': 'Weapon 1',
	'weapon.onemace': 'Weapon 1',
	'weapon.basemace': 'Weapon 1',
	'weapon.sceptre': 'Weapon 1',
	'weapon.staff': 'Weapon 1',
	'weapon.basestaff': 'Weapon 1',
	'weapon.warstaff': 'Weapon 1',
	'weapon.twoaxe': 'Weapon 1',
	'weapon.twomace': 'Weapon 1',
	'weapon.twosword': 'Weapon 1',
	'weapon.wand': 'Weapon 1',
	'weapon.rod': 'Weapon 1',
	'accessory.amulet': 'Amulet',
	'armour.helmet': 'Helmet',
	'armour.shield': 'Weapon 2',
	'armour.quiver': 'Weapon 2',
	'armour.chest': 'Body Armour',
	'armour.gloves': 'Gloves',
	'armour.boots': 'Boots',
	'accessory.ring': 'Ring 1',
	'accessory.belt': 'Belt',
	'jewel': 'Jewel Any',
	'jewel.base': 'Jewel Base',
	'jewel.abyss': 'Jewel Abyss',
};

// map trade api type to pob crafting type
const POB_CRAFT_TYPES = {
	'weapon': 'One Handed Axe',
	'weapon.one': 'One Handed Axe',
	'weapon.onemelee': 'One Handed Axe',
	'weapon.twomelee': 'Two Handed Axe',
	'weapon.bow': 'Bow',
	'weapon.claw': 'Claw',
	'weapon.dagger': 'Dagger',
	'weapon.basedagger': 'Dagger',
	'weapon.runedagger': 'Dagger',
	'weapon.oneaxe': 'One Handed Axe',
	'weapon.onesword': 'One Handed Sword',
	'weapon.onemace': 'One Handed Mace',
	'weapon.basemace': 'One Handed Mace',
	'weapon.sceptre': 'Sceptre',
	'weapon.staff': 'Staff',
	'weapon.basestaff': 'Staff',
	'weapon.warstaff': 'Staff',
	'weapon.twoaxe': 'Two Handed Axe',
	'weapon.twomace': 'Two Handed Mace',
	'weapon.twosword': 'Two Handed Sword',
	'weapon.wand': 'Wand',
	'weapon.rod': 'One Handed Axe',
	'accessory.amulet': 'Amulet',
	'armour.helmet': 'Helmet',
	'armour.shield': 'Shield',
	'armour.quiver': 'Quiver',
	'armour.chest': 'Body Armour',
	'armour.gloves': 'Gloves',
	'armour.boots': 'Boots',
	'accessory.ring': 'Ring',
	'accessory.belt': 'Belt',
	'jewel': 'not craftable',
	'jewel.base': 'not craftable',
	'jewel.abyss': 'not craftable',
};

module.exports = {
	SHORT_PROPERTIES,
	SORT,
	POB_TYPES,
	constants: new Constants(),
};

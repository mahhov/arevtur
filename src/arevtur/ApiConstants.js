const {httpRequest} = require('js-desktop-base');
const dataFetcher = require('../services/DataFetcher');

// Without a non-empty user-agent header, PoE will return 403.
let get = endpoint => httpRequest.get(endpoint, {}, {'User-Agent': '_'});

class Constants {
	constructor() {
		this.leagues = this.initLeagues();
		this.types = this.initTypes();
		this.properties = this.initProperties();
		this.currencies = {};
		this.items = this.initItems();
	}

	async initLeagues() {
		let response = await get('https://api.pathofexile.com/leagues');
		return JSON.parse(response.string)
			.filter(league => !league.rules.some(rule => rule.id === 'NoParties'))
			.map(league => league.id);
		/*
			['Harvest', ...]
		*/
	}

	async initTypes() {
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

	async initProperties() {
		let response = await get('https://www.pathofexile.com/api/trade/data/stats');
		return JSON.parse(response.string).result
			.flatMap(({entries}) => entries)
			.map(({id, text, type}) => ({id, text: `${text} (${type})`}));
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

	async propertyIdToText(id) {
		let properties = await this.properties;
		return properties.find(property => property.id === id)?.text;
	}

	async initCurrencies(league) {
		let currencyPrices = dataFetcher.getData(
			dataFetcher.endpointsByLeague.CURRENCY(league));
		let staticDataStr = get('https://www.pathofexile.com/api/trade/data/static');
		currencyPrices = await currencyPrices;
		staticDataStr = await staticDataStr;

		let tuples = JSON.parse(staticDataStr.string).result
			.find(({id}) => id === 'Currency').entries
			.map(({id, text}) => {
				let price = currencyPrices.lines
					.find(line => line.currencyTypeName === text)
					?.chaosEquivalent;
				return [id, price];
			});

		// todo use the price for 1500 fuse bench craft
		tuples.push(['fatedConnectionsProphecy', 750]);
		tuples.push(['chaos', 1]);
		return Object.fromEntries(tuples);
		/* {alt: .125, ...} */
	}

	currencyPrices(league) {
		// todo consider expiring cache to keep currencies updated even if the apps been running a
		// while
		return this.currencies[league] = this.currencies[league] || this.initCurrencies(league);
	}

	async initItems() {
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
	'jewel.base': 'jewel Base',
	'jewel.abyss': 'jewel Abyss',
};

module.exports = {
	SHORT_PROPERTIES,
	SORT,
	POB_TYPES,
	constants: new Constants(),
};

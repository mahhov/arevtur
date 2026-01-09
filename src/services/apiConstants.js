const {httpRequest, XPromise} = require('js-desktop-base');
const poeNinjaApi = require('./poeNinjaApi');
const configData = require('./config/configData');
const {unique, escapeRegex} = require('../util/util');
const nodeFetch = require('node-fetch');

let localStorage;
if (typeof localStorage === 'undefined') {
	let data = {};
	localStorage = {
		getItem: key => data[key],
		setItem: (key, value) => data[key] = value,
	};
}

class ApiConstants {

	// constants

	shortProperties = {
		totalEleRes: 'pseudo.pseudo_total_elemental_resistance',
		flatLife: 'pseudo.pseudo_total_life',
	};

	sort = {
		value: {'statgroup.0': 'desc'},
		price: {price: 'asc'},
	};

	constructor() {
		// todo[low] need to make it accessible on the singleton. Should figure out a more elegant
		//  syntax. Likewise for the fake-static constants above.
		this.api = ApiConstants.api;
		this.createRequestHeader = ApiConstants.createRequestHeader;
		try {
			this.cache = JSON.parse(localStorage.getItem('api-constants-cache'));
			Object.values(this.cache).forEach(cached => cached.promise = null);
		} catch (e) {
		}
		this.cache ||= {};
	}

	// leagues

	get leagues() {
		return this.cachedRequest('leagues', ApiConstants.initLeagues);
	}

	static async initLeagues(version2) {
		let response = await ApiConstants.get('leagues', version2);
		return JSON.parse(response.string).result
			.filter(league => league.realm === 'pc' || league.realm === 'poe2')
			.map(league => league.id);
		/*
			['Harvest', ...]
		*/
	}

	// types

	get types() {
		return this.cachedRequest('types', ApiConstants.initTypes);
	}

	static async initTypes(version2) {
		let response = await ApiConstants.get('filters', version2);
		let data = JSON.parse(response.string);
		return data.result
			.find(({id}) => id === 'type_filters').filters
			.find(({id}) => id === 'category').option.options
			.map(type => ({id: type.id, text: type.text.replaceAll('-', ' ')}));
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
		return this.cachedRequest('properties', ApiConstants.initProperties);
	}

	static async initProperties(version2) {
		let response = await ApiConstants.get('stats', version2);
		let properties = JSON.parse(response.string).result
			.flatMap(({entries}) => entries)
			.flatMap(({id, text, type, option}) => {
				let property = {id, text: `${text} (${type})`, originalText: text, type};
				return option?.options ?
					option.options.map(o =>
						({...property, optionId: o.id, text: `${text} (${type}) = ${o.text}`})) :
					property;
			});
		properties.unshift({id: '', text: '', originalText: '', type: ''});
		return properties;
	}

	async propertyTexts() {
		let properties = await this.properties;
		return properties.map(({text}) => text);
	}

	async propertyById(id) {
		let properties = await this.properties;
		return properties.find(property => property.id === id);
	}

	async propertyByText(text) {
		let properties = await this.properties;
		return properties.find(property => property.text === text);
	}

	async propertiesByType(type) {
		// possible types:
		// pseudo
		// explicit
		// implicit
		// fractured
		// enchant
		// rune
		// desecrated
		// sanctum
		// skill
		let properties = await this.properties;
		return properties.filter(property => property.type === type);
	}

	// properties by item type

	propertiesByMappedItemType(mappedItemType) {
		return this.cachedRequest('propertiesByMappedItemType', ApiConstants.initPropertiesByMappedItemType, mappedItemType);
	}

	static async initPropertiesByMappedItemType(version2, mappedItemType) {
		let response = await (await fetch(`https://poe2db.tw/us/${mappedItemType}`)).text();
		let mods = [...response.matchAll(/"str":"(.*?)",/g)]
			.map(m => m[1])
			.map(m => m.replaceAll(/<span class='mod-value'>.*?<\/span>/g, '#'))
			.map(m => m.replaceAll(/<span.*?>(.*?)<\/span>/g, '$1'))
			.filter(unique);
		if (!mods.length)
			console.error('Found no PoE DB mods for item type', mappedItemType);
		return mods;
	}

	async propertiesByItemType(itemType) {
		let mappedItemTypes = {
			'Any': [],
			'Any Weapon': [],
			'Any One-Handed Melee Weapon': [],
			'Unarmed': [],
			'Claw': ['Claws'],
			'Dagger': ['Daggers'],
			'One-Handed Sword': [],
			'One-Handed Axe': [],
			'One-Handed Mace': [],
			'Spear': [],
			'Flail': [],
			'Any Two-Handed Melee Weapon': [],
			'Two-Handed Sword': [],
			'Two-Handed Axe': [],
			'Two-Handed Mace': [],
			'Warstaff': [],
			'Any Ranged Weapon': [],
			'Bow': [],
			'Crossbow': [],
			'Any Caster Weapon': [],
			'Wand': ['Wands'],
			'Sceptre': [],
			'Staff': [],
			'Fishing Rod': [],
			'Any Armour': [],
			'Helmet': ['Helmets_str', 'Helmets_dex', 'Helmets_int', 'Helmets_str_dex', 'Helmets_str_int', 'Helmets_dex_int'],
			'Body Armour': ['Body_Armours_str', 'Body_Armours_dex', 'Body_Armours_int', 'Body_Armours_str_dex', 'Body_Armours_str_int', 'Body_Armours_dex_int', 'Body_Armours_str_dex_int'],
			'Gloves': ['Gloves_str', 'Gloves_dex', 'Gloves_int', 'Gloves_str_dex', 'Gloves_str_int', 'Gloves_dex_int'],
			'Boots': ['Boots_str', 'Boots_dex', 'Boots_int', 'Boots_str_dex', 'Boots_str_int', 'Boots_dex_int'],
			'Quiver': [],
			'Shield': ['Shields_str', 'Shields_dex', 'Shields_str_dex', 'Shields_str_int'],
			'Focus': ['Foci'],
			'Buckler': [],
			'Any Accessory': [],
			'Amulet': ['Amulets'],
			'Belt': ['Belts'],
			'Ring': ['Rings'],
			'Any Gem': [],
			'Skill Gem': [],
			'Support Gem': [],
			'Meta Gem': [],
			'Any Jewel': ['Ruby', 'Emerald', 'Sapphire'],
			'Any Flask': [],
			'Life Flask': [],
			'Mana Flask': [],
			'Any Endgame Item': [],
			'Waystone': [],
			'Map Fragment': [],
			'Logbook': [],
			'Breachstone': [],
			'Barya': [],
			'Pinnacle Key': [],
			'Ultimatum Key': [],
			'Tablet': [],
			'Divination Card': [],
			'Relic': [],
			'Any Currency': [],
			'Omen': [],
			'Any Socketable': [],
			'Rune': [],
			'Soul Core': [],
		}[itemType];
		return (await Promise.all(mappedItemTypes
			.map(mappedType => this.propertiesByMappedItemType(mappedType))))
			.flat()
			.filter(unique);
	}

	async parsePropertyCopyText(propertyCopyText) {
		// e.g. '28% reduced Charges per use' -> {propertyText: '#% increased Charges per use', weight: -28, flipIncrease: true}
		let propertyTexts = await this.propertyTexts();

		// average all numbers found
		let weight = (propertyCopyText.match(/\d+(\.\d+)?/g) || []).reduce((sum, v, _, a) => sum + v / a.length, 0);

		let getRegex = (propertyCopyText, flipIncrease) => {
			[
				['increased Gold found in your Maps', 'increased Gold found in your Maps (Gold Piles)'],
				[/\d+ additional Rooms are/, 'An additional Room is'],
				['in Map', 'in your Maps'],
				[/Map has (\d+%) increased chance to contain a Summoning Circle/, 'Area has $1 increased chance to contain a Summoning Circle'],
				[/Map has (\d+%)/, '$1'],
				['Expedition Artifacts', 'Artifacts'],
			].forEach(([from, to]) => propertyCopyText = propertyCopyText.replace(from, to));
			propertyCopyText = escapeRegex(propertyCopyText)
				.replaceAll(/(\d+(\\\.\d+)?)/g, '($1|#)') // e.g. 23.5 -> (23.5|#)
				.replaceAll(/\+/g, '+?');
			if (flipIncrease)
				propertyCopyText = propertyCopyText.replaceAll(/(reduce|increase)/g, '(reduce|increase)');
			propertyCopyText = `(^|\n)${propertyCopyText}( \\((explicit|sanctum)\\))?($|\n)`;
			return new RegExp(propertyCopyText);
		};

		// todo[low] sometimes, there are multiple properties with the same text.
		//   should do an 'or' between them. e.g. '+# to Strength and Intelligence'

		let regex = getRegex(propertyCopyText, false);
		let propertyText = propertyTexts.find(pt => pt.match(regex));
		if (propertyText) return {propertyText, weight, flipIncrease: false};

		let regexFlipIncrease = getRegex(propertyCopyText, true);
		propertyText = propertyTexts.find(pt => pt.match(regexFlipIncrease));
		if (propertyText) return {propertyText, weight: -weight, flipIncrease: true};

		return null;
	}

	// currencies

	currencyPrices(league) {
		return this.cachedRequest('currencies', ApiConstants.initCurrencies, league);
	}

	static async initCurrencies(version2, league) {
		try {
			return await (version2 ?
				ApiConstants.initScoutCurrencies(version2, league) :
				ApiConstants.initNinjaCurrencies(version2, league));
		} catch (e) {
			// todo[medium] show red/orange status indicator
			return version2 ? {exalted: 1} : {chaos: 1};
		}
	}

	static async initNinjaCurrencies(version2, league) {
		let staticData = ApiConstants.get('static', version2);
		let currencyPrices = poeNinjaApi.getData(poeNinjaApi.endpointsByLeague.CURRENCY(league));
		let beastPrices = poeNinjaApi.getData(poeNinjaApi.endpointsByLeague.BEAST(league));
		staticData = JSON.parse((await staticData).string);
		currencyPrices = await currencyPrices;
		beastPrices = await beastPrices;

		let tuples = staticData.result
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

	static async initOrbCurrencies(version2, league) {
		let staticData = ApiConstants.get('static', version2);
		let currencyPrices = nodeFetch(
			`https://orbwatch.trade/api/preload?realm=${league}`,
			{
				headers: {
					referer: 'https://orbwatch.trade/',
					'x-csrf-token': 'x',
					cookie: 'csrf_token=x',
				},
			},
		);
		staticData = JSON.parse((await staticData).string);
		currencyPrices = await (await currencyPrices).json();

		let tuples = staticData.result
			.find(({id}) => id === 'Currency').entries
			.map(({id}) => {
				let price = currencyPrices.prices.currency
					.find(line => line.item_id === id && line.price_type === 'buy')
					?.item_price;
				return [id, Number(price)];
			})
			.filter(v => v);

		let currencies = Object.fromEntries(tuples);
		currencies.exalted = 1;
		return currencies;
		/* {alt: .125, ...} */
	}

	static async initScoutCurrencies(version2, league) {
		let staticData = ApiConstants.get('static', version2);
		let currencyPrices = httpRequest.get('https://poe2scout.com/api/items/currency/currency', {league, perPage: 100});
		staticData = JSON.parse((await staticData).string);
		currencyPrices = JSON.parse((await currencyPrices).string);

		let tuples = staticData.result
			.find(({id}) => id === 'Currency').entries
			.map(({id}) => {
				let price = currencyPrices.items
					.find(line => line.apiId === id)
					?.currentPrice;
				return [id, Number(price)];
			})
			.filter(v => v);

		let currencies = Object.fromEntries(tuples);
		currencies.exalted = 1;
		return currencies;
		/* {alt: .125, ...} */
	}

	// items

	get items() {
		return this.cachedRequest('items', ApiConstants.initItems);
	}

	static async initItems(version2) {
		let response = await ApiConstants.get('items', version2);
		let items = JSON.parse(response.string).result
			.flatMap(({entries}) => entries)
			.map(({name, text, type}) => name || text || type);
		items.unshift('');
		return items;
		/* ['Pledge of Hands', ...] */
	}

	async nameToItem(name) {
		// E.g. 'Bubbling Ultimate Life Flask of the Brewer' -> 'Ultimate Life Flask'
		return (await this.items)
			.filter(item => item && name.includes(item))
			.sort((a, b) => b.length - a.length)[0];
	}

	// utility

	static get api() {
		return 'https://pathofexile.com';
	}

	static createRequestHeader(sessionId = undefined) {
		return {
			// Without a non-empty user-agent header, PoE will return 403.
			'User-Agent': `arevtur2`,
			Cookie: sessionId ? `POESESSID=${sessionId}` : '',
			'content-type': 'application/json',
			'x-requested-with': 'XMLHttpRequest',
		};
	}

	static get(name, version2) {
		let endpoint = `${ApiConstants.api}/api/trade${version2 ? 2 : ''}/data/${name}`;
		return httpRequest.get(endpoint, {}, ApiConstants.createRequestHeader());
	}

	async cachedRequest(cacheKey, initializer, ...args) {
		let hour1 = 60 * 60 * 1000;
		while (true) {
			let version2 = configData.config.version2;
			cacheKey = [cacheKey, version2, ...args].join();
			if (!this.cache[cacheKey] ||
				Date.now() - this.cache[cacheKey].lastRequest > hour1 ||
				(!this.cache[cacheKey].promise || this.cache[cacheKey].promise.error) && !this.cache[cacheKey].value) {
				this.cache[cacheKey] = {
					lastRequest: Date.now(),
					promise: new XPromise(initializer(version2, ...args)),
				};
				this.cache[cacheKey].value = await this.cache[cacheKey].promise;
				localStorage.setItem('api-constants-cache', JSON.stringify(this.cache));
			}
			if (this.cache[cacheKey].promise)
				await this.cache[cacheKey].promise;
			if (version2 === configData.config.version2)
				return this.cache[cacheKey].value;
		}
	}
}

module.exports = new ApiConstants();

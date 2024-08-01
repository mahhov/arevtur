const {httpRequest: {get}} = require('js-desktop-base');

let getEndpointsByLeague = () => {
	const BASE = 'https://poe.ninja/api/data';
	const ITEM = `itemoverview`;
	const CURRENCY = `currencyoverview`;

	let genEndpointByLeague = (prefix, type) => league => `${BASE}/${prefix}?league=${league}&type=${type}`;

	return {
		GEM: genEndpointByLeague(ITEM, 'SkillGem'),
		DIVINATION_CARD: genEndpointByLeague(ITEM, 'DivinationCard'),
		ESSENCE: genEndpointByLeague(ITEM, 'Essence'),
		CURRENCY: genEndpointByLeague(CURRENCY, 'Currency'),
		UNIQUE_JEWEL: genEndpointByLeague(ITEM, 'UniqueJewel'),
		UNIQUE_FLASK: genEndpointByLeague(ITEM, 'UniqueFlask'),
		UNIQUE_WEAPON: genEndpointByLeague(ITEM, 'UniqueWeapon'),
		UNIQUE_ARMOUR: genEndpointByLeague(ITEM, 'UniqueArmour'),
		UNIQUE_ACCESSORY: genEndpointByLeague(ITEM, 'UniqueAccessory'),
		UNIQUE_MAP: genEndpointByLeague(ITEM, 'UniqueMap'),
		FOSSIL: genEndpointByLeague(ITEM, 'Fossil'),
		RESONATOR: genEndpointByLeague(ITEM, 'Resonator'),
		FRAGMENT: genEndpointByLeague(CURRENCY, 'Fragment'),
		MAP: genEndpointByLeague(ITEM, 'Map'),
		SCARAB: genEndpointByLeague(ITEM, 'Scarab'),
		BASE_ITEM: genEndpointByLeague(ITEM, 'BaseType'),
		INCUBATOR: genEndpointByLeague(ITEM, 'Incubator'),
		OIL: genEndpointByLeague(ITEM, 'Oil'),
		BEAST: genEndpointByLeague(ITEM, 'Beast'),
		DELIRIUM_ORB: genEndpointByLeague(ITEM, 'DeliriumOrb'),
	};
};

let endpointsByLeague = getEndpointsByLeague();

const CACHE_DURATION_S = 12 * 60; // 12 minutes

let priceCache = {};

let getData = endpoint => {
	let timestampS = process.hrtime()[0];
	let cache = priceCache[endpoint] = priceCache[endpoint] || {};

	if (cache.data && timestampS - cache.timestampS < CACHE_DURATION_S)
		return cache.data;

	cache.timestampS = timestampS;
	return cache.data = get(endpoint)
		.then(({string}) => JSON.parse(string))
		.catch(e => {
			cache.data = null;
			console.error(`Unable to connect to '${endpoint}': ${e}`)
		});
};

module.exports = {endpointsByLeague, getData};

// axios.get = endpoint => Promise.resolve({data: {lines: endpoint + ' ' + parseInt(Math.random() * 10000)}});
// df = require('./DataFetcher');
// df.getData(df.Endpoints.DIVINATION_CARD).then(data => console.log(data));
// df.getData(df.Endpoints.UNIQUE_ACCESSORY).then(data => console.log(data));

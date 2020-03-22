const {httpRequest: {get}} = require('js-desktop-base');
const appData = require('./appData');

let getEndpoints = league => {
	const BASE = 'https://poe.ninja/api/data';
	const ITEM = `${BASE}/itemoverview?league=${league}`;
	const CURRENCY = `${BASE}/currencyoverview?league=${league}`;

	let endpoint = (prefix, type) => `${prefix}&type=${type}`;

	return {
		GEM: endpoint(ITEM, 'SkillGem'),
		DIVINATION_CARD: endpoint(ITEM, 'DivinationCard'),
		ESSENCE: endpoint(ITEM, 'Essence'),
		CURRENCY: endpoint(CURRENCY, 'Currency'),
		UNIQUE_JEWEL: endpoint(ITEM, 'UniqueJewel'),
		UNIQUE_FLASK: endpoint(ITEM, 'UniqueFlask'),
		UNIQUE_WEAPON: endpoint(ITEM, 'UniqueWeapon'),
		UNIQUE_ARMOUR: endpoint(ITEM, 'UniqueArmour'),
		UNIQUE_ACCESSORY: endpoint(ITEM, 'UniqueAccessory'),
		UNIQUE_MAP: endpoint(ITEM, 'UniqueMap'),
		FOSSIL: endpoint(ITEM, 'Fossil'),
		RESONATOR: endpoint(ITEM, 'Resonator'),
		FRAGMENT: endpoint(CURRENCY, 'Fragment'),
		PROPHECY: endpoint(ITEM, 'Prophecy'),
		MAP: endpoint(ITEM, 'Map'),
		SCARAB: endpoint(ITEM, 'Scarab'),
		BASE_ITEM: endpoint(ITEM, 'BaseType'),
		INCUBATOR: endpoint(ITEM, 'Incubator'),
		OIL: endpoint(ITEM, 'Oil'),
	};
};

let endpoints = getEndpoints(appData.config.league);

const CACHE_DURATION_S = 12 * 60; // 12 minutes

let priceCache = {};

let getData = endpoint => {
	let timestampS = process.hrtime()[0];
	let cache = priceCache[endpoint] = priceCache[endpoint] || {};

	if (cache.data && timestampS - cache.timestampS < CACHE_DURATION_S)
		return cache.data;

	cache.timestampS = timestampS;
	return cache.data = get(endpoint)
		.catch(e => {
			cache.data = null;
			console.error(`Unable to connect to '${endpoint}': ${e}`)
		});
};

module.exports = {endpoints, getData};

// axios.get = endpoint => Promise.resolve({data: {lines: endpoint + ' ' + parseInt(Math.random() * 10000)}});
// df = require('./DataFetcher');
// df.getData(df.Endpoints.DIVINATION_CARD).then(data => console.log(data));
// df.getData(df.Endpoints.UNIQUE_ACCESSORY).then(data => console.log(data));

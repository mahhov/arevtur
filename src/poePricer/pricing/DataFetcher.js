const httpRequest = require('../../base/httpRequest');

let getEndpoints = league => {
	const BASE = 'https://poe.ninja/api/data';
	const ITEM = `${BASE}/itemoverview?league=${league}`;
	const CURRENCY = `${BASE}/currencyoverview?league=${league}`;

	return {
		GEM: `${ITEM}&type=SkillGem`,
		DIVINATION_CARD: `${ITEM}&type=DivinationCard`,
		ESSENCE: `${ITEM}&type=Essence`,
		CURRENCY: `${CURRENCY}&type=Currency`,
		UNIQUE_JEWEL: `${ITEM}&type=UniqueJewel`,
		UNIQUE_FLASK: `${ITEM}&type=UniqueFlask`,
		UNIQUE_WEAPON: `${ITEM}&type=UniqueWeapon`,
		UNIQUE_ARMOUR: `${ITEM}&type=UniqueArmour`,
		UNIQUE_ACCESSORY: `${ITEM}&type=UniqueAccessory`,
		UNIQUE_MAP: `${ITEM}&type=UniqueMap`,
		FOSSIL: `${ITEM}&type=Fossil`,
		RESONATOR: `${ITEM}&type=Resonator`,
		FRAGMENT: `${CURRENCY}&type=Fragment`,
		PROPHECY: `${ITEM}&type=Prophecy`,
		MAP: `${ITEM}&type=Map`,
		SCARAB: `${ITEM}&type=Scarab`,
		BASE_ITEM: `${ITEM}&type=BaseType`,
	};
};

const CACHE_DURATION_S = 4 * 60; // 4 minutes

let priceCache = {};

let getData = endpoint => {
	let timestampS = process.hrtime()[0];
	let cache = priceCache[endpoint] = priceCache[endpoint] || {};

	if (cache.data && timestampS - cache.timestampS < CACHE_DURATION_S)
		return cache.data;

	cache.timestampS = timestampS
	return cache.data = httpRequest(endpoint)
		.catch(e => {
			cache.data = null;
			console.error(`Unable to connect to '${endpoint}': ${e}`)
		});
};

module.exports = {getEndpoints, getData};

// axios.get = endpoint => Promise.resolve({data: {lines: endpoint + ' ' + parseInt(Math.random() * 10000)}});
// df = require('./DataFetcher');
// df.getData(df.Endpoints.DIVINATION_CARD).then(data => console.log(data));
// df.getData(df.Endpoints.UNIQUE_ACCESSORY).then(data => console.log(data));

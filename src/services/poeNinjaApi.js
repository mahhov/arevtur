const {httpRequest: {get}} = require('js-desktop-base');
var querystring = require('querystring');

let getEndpointsByLeague = () => {
	const BASE = 'https://poe.ninja/api/data';
	const ITEM = `itemoverview`;
	const CURRENCY = `currencyoverview`;

	let genEndpointByLeague = (prefix, type) =>
		league => `${BASE}/${prefix}?${querystring.stringify({league, type})}`;

	return {
		CURRENCY: genEndpointByLeague(CURRENCY, 'Currency'),
		FRAGMENT: genEndpointByLeague(CURRENCY, 'Fragment'),
		KALGUURAN_RUNE: genEndpointByLeague(ITEM, 'KalguuranRune'),
		TATTOO: genEndpointByLeague(ITEM, 'Tattoo'),
		OMENS: genEndpointByLeague(ITEM, 'Omen'),
		DIVINATION_CARD: genEndpointByLeague(ITEM, 'DivinationCard'),
		ARTIFACT: genEndpointByLeague(ITEM, 'Artifact'),
		OIL: genEndpointByLeague(ITEM, 'Oil'),
		INCUBATOR: genEndpointByLeague(ITEM, 'Incubator'),

		UNIQUE_WEAPON: genEndpointByLeague(ITEM, 'UniqueWeapon'),
		UNIQUE_ARMOUR: genEndpointByLeague(ITEM, 'UniqueArmour'),
		UNIQUE_ACCESSORY: genEndpointByLeague(ITEM, 'UniqueAccessory'),
		UNIQUE_FLASK: genEndpointByLeague(ITEM, 'UniqueFlask'),
		UNIQUE_JEWEL: genEndpointByLeague(ITEM, 'UniqueJewel'),
		UNIQUE_RELIC: genEndpointByLeague(ITEM, 'UniqueRelic'),
		SKILL_GEM: genEndpointByLeague(ITEM, 'SkillGem'),
		CLUSTER_JEWEL: genEndpointByLeague(ITEM, 'ClusterJewel'),

		MAP: genEndpointByLeague(ITEM, 'Map'),
		BLIGHTED_MAP: genEndpointByLeague(ITEM, 'BlightedMap'),
		BLIGHT_RAVAGED_MAP: genEndpointByLeague(ITEM, 'BlightRavagedMap'),
		UNIQUE_MAP: genEndpointByLeague(ITEM, 'UniqueMap'),
		DELIRIUM_ORB: genEndpointByLeague(ITEM, 'DeliriumOrb'),
		INVITATION: genEndpointByLeague(ITEM, 'Invitation'),
		SCARAB: genEndpointByLeague(ITEM, 'Scarab'),
		MEMORY: genEndpointByLeague(ITEM, 'Memory'),

		BASE_ITEM: genEndpointByLeague(ITEM, 'BaseType'),
		FOSSIL: genEndpointByLeague(ITEM, 'Fossil'),
		RESONATOR: genEndpointByLeague(ITEM, 'Resonator'),
		BEAST: genEndpointByLeague(ITEM, 'Beast'),
		ESSENCE: genEndpointByLeague(ITEM, 'Essence'),
		VIAL: genEndpointByLeague(ITEM, 'Vial'),
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
			console.error(`Unable to connect to '${endpoint}':`, e);
		});
};

module.exports = {endpointsByLeague, getData};

// axios.get = endpoint => Promise.resolve({data: {lines: endpoint + ' ' + parseInt(Math.random() *
// 10000)}}); df = require('./DataFetcher'); df.getData(df.Endpoints.DIVINATION_CARD).then(data =>
// console.log(data)); df.getData(df.Endpoints.UNIQUE_ACCESSORY).then(data => console.log(data));

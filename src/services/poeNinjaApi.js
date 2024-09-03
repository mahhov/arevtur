const {httpRequest: {get}} = require('js-desktop-base');
const querystring = require('querystring');

class PoeNinjaApi {
	constructor() {
		const ITEM = `itemoverview`;
		const CURRENCY = `currencyoverview`;

		this.endpointsByLeague = {
			CURRENCY: PoeNinjaApi.genEndpointByLeague(CURRENCY, 'Currency'),
			FRAGMENT: PoeNinjaApi.genEndpointByLeague(CURRENCY, 'Fragment'),
			KALGUURAN_RUNE: PoeNinjaApi.genEndpointByLeague(ITEM, 'KalguuranRune'),
			TATTOO: PoeNinjaApi.genEndpointByLeague(ITEM, 'Tattoo'),
			OMENS: PoeNinjaApi.genEndpointByLeague(ITEM, 'Omen'),
			DIVINATION_CARD: PoeNinjaApi.genEndpointByLeague(ITEM, 'DivinationCard'),
			ARTIFACT: PoeNinjaApi.genEndpointByLeague(ITEM, 'Artifact'),
			OIL: PoeNinjaApi.genEndpointByLeague(ITEM, 'Oil'),
			INCUBATOR: PoeNinjaApi.genEndpointByLeague(ITEM, 'Incubator'),

			UNIQUE_WEAPON: PoeNinjaApi.genEndpointByLeague(ITEM, 'UniqueWeapon'),
			UNIQUE_ARMOUR: PoeNinjaApi.genEndpointByLeague(ITEM, 'UniqueArmour'),
			UNIQUE_ACCESSORY: PoeNinjaApi.genEndpointByLeague(ITEM, 'UniqueAccessory'),
			UNIQUE_FLASK: PoeNinjaApi.genEndpointByLeague(ITEM, 'UniqueFlask'),
			UNIQUE_JEWEL: PoeNinjaApi.genEndpointByLeague(ITEM, 'UniqueJewel'),
			UNIQUE_RELIC: PoeNinjaApi.genEndpointByLeague(ITEM, 'UniqueRelic'),
			SKILL_GEM: PoeNinjaApi.genEndpointByLeague(ITEM, 'SkillGem'),
			CLUSTER_JEWEL: PoeNinjaApi.genEndpointByLeague(ITEM, 'ClusterJewel'),

			MAP: PoeNinjaApi.genEndpointByLeague(ITEM, 'Map'),
			BLIGHTED_MAP: PoeNinjaApi.genEndpointByLeague(ITEM, 'BlightedMap'),
			BLIGHT_RAVAGED_MAP: PoeNinjaApi.genEndpointByLeague(ITEM, 'BlightRavagedMap'),
			UNIQUE_MAP: PoeNinjaApi.genEndpointByLeague(ITEM, 'UniqueMap'),
			DELIRIUM_ORB: PoeNinjaApi.genEndpointByLeague(ITEM, 'DeliriumOrb'),
			INVITATION: PoeNinjaApi.genEndpointByLeague(ITEM, 'Invitation'),
			SCARAB: PoeNinjaApi.genEndpointByLeague(ITEM, 'Scarab'),
			MEMORY: PoeNinjaApi.genEndpointByLeague(ITEM, 'Memory'),

			BASE_ITEM: PoeNinjaApi.genEndpointByLeague(ITEM, 'BaseType'),
			FOSSIL: PoeNinjaApi.genEndpointByLeague(ITEM, 'Fossil'),
			RESONATOR: PoeNinjaApi.genEndpointByLeague(ITEM, 'Resonator'),
			BEAST: PoeNinjaApi.genEndpointByLeague(ITEM, 'Beast'),
			ESSENCE: PoeNinjaApi.genEndpointByLeague(ITEM, 'Essence'),
			VIAL: PoeNinjaApi.genEndpointByLeague(ITEM, 'Vial'),
		};

		this.cache = {};
	}

	static genEndpointByLeague(prefix, type) {
		const BASE = 'https://poe.ninja/api/data';
		return league => `${BASE}/${prefix}?${querystring.stringify({league, type})}`;
	}

	getData(endpoint) {
		const CACHE_DURATION_S = 12 * 60; // 12 minutes

		// todo[low] consolidate Date.now(), performance.now(), and process.hrtime()
		let timestampS = process.hrtime()[0];
		let cache = this.cache[endpoint] = this.cache[endpoint] || {};

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
}

module.exports = new PoeNinjaApi();

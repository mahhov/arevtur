const {httpRequest: {get}} = require('js-desktop-base');
const querystring = require('querystring');
const Cache = require('../util/Cache');

class PoeNinjaApi {
	constructor() {
		const ITEM = `item/overview`;
		const CURRENCY = `currency/overview`;

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

		this.cache = new Cache(12 * 60 * 1000, endpoint =>
			get(endpoint).then(({string}) => JSON.parse(string)));
	}

	static genEndpointByLeague(prefix, type) {
		const BASE = 'https://poe.ninja/poe1/api/economy/stash/current';
		return league => `${BASE}/${prefix}?${querystring.stringify({league, type})}`;
	}

	getData(endpoint) {
		return this.cache.get(endpoint);
	};
}

module.exports = new PoeNinjaApi();

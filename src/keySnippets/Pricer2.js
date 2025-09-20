const {httpRequest: {get}} = require('js-desktop-base');
const configData = require('../services/config/configData');
const {unique, round, unitText} = require('../util/util');
const UnifiedQueryParams = require('../arevtur/UnifiedQueryParams');
const TradeQuery = require('../arevtur/TradeQuery');
const apiConstants = require('../arevtur/apiConstants');
const Cache = require('../util/Cache');

let priceText = async price => {
	let league = configData.config.league;
	let currencyPrices = await apiConstants.currencyPrices(league);
	return unitText(price, currencyPrices.divine, 2, 'exalt', 'divine');
};

class Poe2ScoutPricer {
	static endpointTypes = [
		'currency/currency',
		'currency/fragments',
		'currency/runes',
		'currency/talismans',
		'currency/essences',
		'currency/ultimatum',
		'currency/expedition',
		'currency/ritual',
		'currency/vaultkeys',
		'currency/breach',
		'currency/abyss',
		'currency/uncutgems',
		'currency/lineagesupportgems',
		'currency/delirium',
		'unique/accessory',
		'unique/armour',
		'unique/flask',
		'unique/jewel',
		'unique/map',
		'unique/weapon',
		'unique/sanctum',
	];

	static #cache = new Cache(12 * 60 * 1000, endpoint =>
		get(endpoint).then(({string}) => JSON.parse(string)));

	#endpointType;

	constructor(endpointType) {
		this.#endpointType = endpointType;
	}

	get #data() {
		let league = configData.config.league;
		let endpoint = `https://poe2scout.com/api/items/${this.#endpointType}?page=1&perPage=250&league=${league}`;
		return Poe2ScoutPricer.#cache.get(endpoint);
	}

	async getPrice(text) {
		let textName = text.split(/\r?\n/)[2];
		let item = (await this.#data).items.find(item => textName === item.text || textName === item.name);
		if (!item)
			return Promise.reject();
		let price = item.currentPrice;
		return [
			textName,
			this.endpointType,
			priceText(price),
			price < 1 ? round(1 / price, 2) + ' : 1ex' : '',
		].filter(v => v);
	}
}

class PoeTradeApiPricer {
	async getPrice(text) {
		let lines = text.split(/\r?\n/);
		if (!lines[0].startsWith('Item Class: ') || lines[1] !== 'Rarity: Normal')
			return Promise.reject('');
		let unifiedQueryParams = new UnifiedQueryParams();
		unifiedQueryParams.name = lines[2];
		unifiedQueryParams.currencyType = 'exalted_divine';
		unifiedQueryParams.offline = 'securable';
		unifiedQueryParams.minItemLevel = lines.map(l => l.match(/Item Level: (\d+)/)).find(v => v)?.[1];
		unifiedQueryParams.rarity = 'normal';
		let tradeQuery = new TradeQuery(unifiedQueryParams, true, configData.config.league, configData.config.sessionId);
		let tradeQueryQuery = await tradeQuery.getQuery();
		let items = await tradeQuery.queryAndParseItems(tradeQueryQuery, 'pricer', true);
		let prices = [items[0], items[items.length - 1]]
			.filter(unique)
			.map(item => [
				item.displayLines[1],
				item.pricePromise.resolved.priceSummary
			])
			.flat();
		return prices;
	}
}

let pricers = [
	...Poe2ScoutPricer.endpointTypes.map(endpointType => new Poe2ScoutPricer(endpointType)),
	new PoeTradeApiPricer(),
];

let getPrice = async text =>
	(await Promise.allSettled(pricers.map(pricer => pricer.getPrice(text))))
		.filter(p => p.status === 'fulfilled')
		.map(p => p.value)
		.flat();

module.exports = {getPrice};

const {httpRequest: {get}} = require('js-desktop-base');
const configData = require('../services/config/configData');
const {unique, round, unitText} = require('../util/util');
const UnifiedQueryParams = require('../arevtur/UnifiedQueryParams');
const TradeQuery = require('../arevtur/TradeQuery');
const apiConstants = require('../arevtur/apiConstants');

let priceText = async price => {
	let league = configData.config.league;
	let currencyPrices = await apiConstants.currencyPrices(league);
	return unitText(price, currencyPrices.divine, 2, 'exalt', 'divine');
};

let endpointTypes = [
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

let dataCache = {};

let getData = (endpointType) => {
	let league = configData.config.league;
	let endpoint = `https://poe2scout.com/api/items/${endpointType}?page=1&perPage=250&league=${league}`;
	const CACHE_DURATION_MS = 12 * 60 * 1000; // 12 minutes

	let timestampS = performance.now();
	let cache = dataCache[endpoint] = dataCache[endpoint] || {};

	if (cache.data && timestampS - cache.timestampS < CACHE_DURATION_MS)
		return cache.data;

	cache.timestampS = timestampS;
	return cache.data = get(endpoint)
		.then(({string}) => JSON.parse(string))
		.catch(e => {
			cache.data = null;
			console.error(`Unable to connect to '${endpoint}':`, e);
		});
};

let getScoutPrice = async (endpointType, text) => {
	let textName = text.split(/\r?\n/)[2];
	let data = await getData(endpointType);
	let item = data.items.find(item => textName === item.text || textName === item.name);
	if (!item)
		return Promise.reject();
	let price = item.currentPrice;
	return [
		textName,
		endpointType,
		priceText(price),
		price < 1 ? round(1 / price, 2) + ' : 1ex' : '',
	].filter(v => v);
};

let getNameQueryPrice = async text => {
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
};

let getPrice = async text =>
	(await Promise.allSettled([
		...endpointTypes.map(endpointType => getScoutPrice(endpointType, text)),
		getNameQueryPrice(text)
	]))
		.filter(p => p.status === 'fulfilled')
		.map(p => p.value)
		.flat();

module.exports = {getPrice};

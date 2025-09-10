const {httpRequest: {get}} = require('js-desktop-base');
const configForMain = require('../services/config/configForMain');
const {round} = require('../util/util');

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
	let league = configForMain.config.league;
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

class Pricer {
	endpoint(league) {
	}

	isItem(itemText, dataItemObj) {
		return itemText.split('\n')[2] === dataItemObj.name;
	}

	price(dataItemObj) {
		return dataItemObj.currentPrice;
	}
}

let getPrice = async text => {
	let textName = text.split(/\r?\n/)[2];
	let matches = endpointTypes.map(async endpointType => {
		let data = await getData(endpointType);
		let item = data.items.find(item => textName === item.text || textName === item.name);
		let price = item.currentPrice;
		return item ?
			[
				textName,
				endpointType,
				round(price, 2) + ' ex',
				price < 1 ? round(1 / price, 2) + ' : 1ex' : '',
				// todo[high] show divine prices
				// unitText(price, divine, 1, 'exalt', 'divine'),
			].filter(v => v) :
			Promise.reject();
	});
	return (await Promise.allSettled(matches))
		.filter(p => p.status === 'fulfilled')
		.map(p => p.value)
		.flat();
};

module.exports = {getPrice};

const {httpRequest: {get}} = require('js-desktop-base');
const configData = require('../services/config/configData');
const {unique, join, round, unitText, escapeRegex} = require('../util/util');
const UnifiedQueryParams = require('../services/UnifiedQueryParams');
const TradeQuery = require('../services/tradeQuery/TradeQuery');
const apiConstants = require('../services/apiConstants');
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
		if (!textName) return Promise.reject();
		let item = (await this.#data).items.find(item => textName === item.text || textName === item.name);
		if (!item) return Promise.reject();
		let price = item.currentPrice;
		return [
			textName,
			this.endpointType,
			await priceText(price),
			price < 1 ? round(1 / price, 2) + ' : 1ex' : '',
		].filter(v => v);
	}
}

class PoeTradeApiPricer {
	get title() {
		return '';
	}

	createUnifiedQueryParams(lines) {
		return null;
	}

	async getPrice(text) {
		let lines = text.split(/\r?\n/);
		let unifiedQueryParams = await this.createUnifiedQueryParams(lines);
		if (!unifiedQueryParams)
			return Promise.reject('');
		let tradeQuery = new TradeQuery(unifiedQueryParams, true, configData.config.league, configData.config.sessionId);
		tradeQuery.errorStream.forEach(error => console.warn(error));
		let tradeQueryQuery = await tradeQuery.getQuery();
		let items = await tradeQuery.queryAndParseItems(tradeQueryQuery, 'pricer', true);
		let itemCount = tradeQuery.progressStream.written.reduce((sum, progress) => sum + progress.itemCount, 0);
		let prices = items
			.map(item => item.pricePromise.resolved)
			.sort((p1, p2) => p1.price - p2.price)
			.map(pricePromise => pricePromise.priceSummary);
		let priceRange = [prices[0], prices[prices.length - 1]].filter(unique).join(' - ');
		let allPrices = prices[0] !== prices[prices.length - 1] ? prices.join(', ') : '';
		return [
			`@bold,pink ${priceRange}@normal  (${itemCount} items)`,
			allPrices,
			this.title,
			items[0].displayLines[1],
		].filter(v => v);
	}
}

class PoeTradeApiNormalBasePricer extends PoeTradeApiPricer {
	get title() {
		return 'Normal base pricer';
	}

	createUnifiedQueryParams(lines) {
		if (!lines[0].startsWith('Item Class: ') || lines[1] !== 'Rarity: Normal')
			return null;

		let unifiedQueryParams = new UnifiedQueryParams();
		unifiedQueryParams.name = lines[2].replace(/^Exceptional /, '');
		unifiedQueryParams.currencyType = 'exalted_divine';
		unifiedQueryParams.offline = 'securable';
		unifiedQueryParams.minItemLevel = lines.map(l => l.match(/Item Level: (\d+)/)).find(v => v)?.[1];
		unifiedQueryParams.rarity = 'normal';
		let quality = lines.map(l => l.match(/Quality: \+(\d+)/)).find(v => v)?.[1];
		if (quality > 20)
			unifiedQueryParams.minQuality = quality;
		unifiedQueryParams.uncorrupted = true;
		return unifiedQueryParams;
	}
}

class PoeTradeApiFlaskPricer extends PoeTradeApiPricer {
	get title() {
		return 'Flask pricer';
	}

	async createUnifiedQueryParams(lines) {
		if (!lines[0].match(/Item Class: (Life|Mana) Flasks/))
			return null;

		let unifiedQueryParams = await UnifiedQueryParams.fromItemText(lines);
		unifiedQueryParams.currencyType = 'exalted_divine';
		unifiedQueryParams.offline = 'securable';
		return unifiedQueryParams;
	}
}

class PoeTradeApiTabletPricer extends PoeTradeApiPricer {
	get title() {
		return 'Tablet pricer';
	}

	async createUnifiedQueryParams(lines) {
		if (lines[0] !== 'Item Class: Tablet')
			return null;

		let unifiedQueryParams = await UnifiedQueryParams.fromItemText(lines);
		unifiedQueryParams.currencyType = 'exalted_divine';
		unifiedQueryParams.offline = 'securable';
		return unifiedQueryParams;
	}
}

class PoeTradeApiWaystonePricer extends PoeTradeApiPricer {
	get title() {
		return 'Waystone pricer';
	}

	createUnifiedQueryParams(lines) {
		if (lines[0] !== 'Item Class: Waystones' || lines[1] === 'Rarity: Normal')
			return null;

		let unifiedQueryParams = new UnifiedQueryParams();
		unifiedQueryParams.waystoneTier = lines.map(l => l.match(/Waystone Tier: (\d+)/)).find(v => v)?.[1];
		unifiedQueryParams.waystonePackSize = lines.map(l => l.match(/Monster Pack Size: \+(\d+)/)).find(v => v)?.[1];
		unifiedQueryParams.waystoneMagicMonsters = lines.map(l => l.match(/Magic Monsters: \+(\d+)/)).find(v => v)?.[1];
		unifiedQueryParams.waystoneRareMonsters = lines.map(l => l.match(/Rare Monsters: \+(\d+)/)).find(v => v)?.[1];
		unifiedQueryParams.waystoneDropChance = lines.map(l => l.match(/Waystone Drop Chance: \+(\d+)/)).find(v => v)?.[1];
		unifiedQueryParams.waystoneItemRarity = lines.map(l => l.match(/Item Rarity: \+(\d+)/)).find(v => v)?.[1];
		unifiedQueryParams.currencyType = 'exalted_divine';
		unifiedQueryParams.offline = 'securable';
		return unifiedQueryParams;
	}
}

class PoeTradeApiJewelPricer extends PoeTradeApiPricer {
	get title() {
		return 'Jewel pricer';
	}

	async createUnifiedQueryParams(lines) {
		if (lines[0] !== 'Item Class: Jewels')
			return null;

		let unifiedQueryParams = await UnifiedQueryParams.fromItemText(lines);
		unifiedQueryParams.currencyType = 'exalted_divine';
		unifiedQueryParams.offline = 'securable';
		return unifiedQueryParams;
	}
}

class PoeTradeApiRarePricer extends PoeTradeApiPricer {
	get title() {
		return 'Rare pricer';
	}

	async createUnifiedQueryParams(lines) {
		if (lines[1] === 'Rarity: Normal')
			return null;

		let unifiedQueryParams = await UnifiedQueryParams.fromItemText(lines);
		unifiedQueryParams.currencyType = 'exalted_divine';
		unifiedQueryParams.offline = 'securable';
		return unifiedQueryParams;
	}
}

let pricers = [
	...Poe2ScoutPricer.endpointTypes.map(endpointType => new Poe2ScoutPricer(endpointType)),
	new PoeTradeApiNormalBasePricer(),
	new PoeTradeApiFlaskPricer(),
	new PoeTradeApiTabletPricer(),
	new PoeTradeApiWaystonePricer(),
	new PoeTradeApiJewelPricer(),
	// new PoeTradeApiRarePricer(),
];

let getPrice = async text =>
	(await Promise.allSettled(pricers.map(pricer => pricer.getPrice(text.trim()))))
		.filter(p => p.status === 'fulfilled')
		.map(p => p.value)
		.map(join('----'))
		.flat(2);

module.exports = {getPrice};

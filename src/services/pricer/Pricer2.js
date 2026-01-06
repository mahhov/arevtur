const {httpRequest: {get}} = require('js-desktop-base');
const configData = require('../config/configData');
const {unique, round, unitText} = require('../../util/util');
const UnifiedQueryParams = require('../UnifiedQueryParams');
const TradeQuery = require('../tradeQuery/TradeQuery');
const apiConstants = require('../apiConstants');
const Cache = require('../../util/Cache');

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

	// returns promise<string>
	async getPrice(text) {
		let textName = text.split(/\r?\n/)[2];
		if (!textName) return Promise.reject();
		let item = (await this.#data).items.find(item => textName === item.text || textName === item.name);
		if (!item) return Promise.reject();
		let price = item.currentPrice;
		return [
			textName,
			this.#endpointType,
			await priceText(price),
			price < 1 ? round(1 / price, 2) + ' : 1ex' : '',
		].filter(v => v).join('\n');
	}
}

class PoeTradeApiPricer {
	get title() {
		return '';
	}

	createUnifiedQueryParams(lines) {
		return null;
	}

	// returns promise<string>
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
			lines[2],
			`@bold,pink ${priceRange}@normal  (${itemCount} items)`,
			allPrices,
			this.title,
			items[0]?.displayLines[1],
		].filter(v => v).join('\n');
	}
}

class PoeTradeApiExactPricer extends PoeTradeApiPricer {
	get title() {
		return 'Exact pricer';
	}

	async createUnifiedQueryParams(lines) {
		let supportedItemClasses = [
			'Life Flasks',
			'Mana Flasks',
			'Jewels',
			'Relics',
		];
		let itemClass = lines[0].split('Item Class: ')[1];
		if (!supportedItemClasses.includes(itemClass))
			return;

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
			return;

		let unifiedQueryParams = await UnifiedQueryParams.fromItemText(lines);
		unifiedQueryParams.currencyType = 'exalted_divine';
		unifiedQueryParams.offline = 'securable';
		let type = lines.map(l => l.match(/Adds (.+) to a Map \(implicit\)/)).find(v => v)?.[1]
		let uses = lines.map(l => l.match(/(\d+) uses remaining \(implicit\)/)).find(v => v)?.[1]
		unifiedQueryParams.andEntries.push(new UnifiedQueryParams.Entry(`Adds ${type} to a Map \n# use remaining (implicit)`, uses))
		console.log(unifiedQueryParams.andEntries)
		return unifiedQueryParams;
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
		let charmSlots = lines.map(l => l.match(/Has (\d+) Charm Slots \(implicit\)/)).find(v => v)?.[1];
		if (charmSlots)
			unifiedQueryParams.andEntries.push(new UnifiedQueryParams.Entry('Has # Charm Slot (implicit)', charmSlots));
		unifiedQueryParams.uncorrupted = true;
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
	new PoeTradeApiExactPricer(),
	new PoeTradeApiTabletPricer(),
	new PoeTradeApiWaystonePricer(),
	// new PoeTradeApiRarePricer(),
	// new PoeTradeApiRecombinatorPricer(),
];

// returns promise<string>[]
let getPrices = text => pricers.map(pricer => pricer.getPrice(text.trim()));

module.exports = {getPrices};

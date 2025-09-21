const {httpRequest: {get}} = require('js-desktop-base');
const configData = require('../services/config/configData');
const {unique, join, round, unitText, escapeRegex} = require('../util/util');
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
		return ' pricer';
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
		let prices = [items[0], items[items.length - 1]]
			.map(item => item.pricePromise.resolved.priceSummary)
			.filter(unique);
		return [
			this.title,
			items[0].displayLines[1],
			prices.join(' - '),
		];
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
		return unifiedQueryParams;
	}
}

class PoeTradeApiExceptionalBasePricer extends PoeTradeApiPricer {
	get title() {
		return 'Exceptional normal base pricer';
	}

	createUnifiedQueryParams(lines) {
		if (!lines[0].startsWith('Item Class: ') || lines[1] !== 'Rarity: Normal' || !lines[2].startsWith('Exceptional '))
			return null;

		let unifiedQueryParams = new UnifiedQueryParams();
		unifiedQueryParams.name = lines[2].replace(/^Exceptional /, '');
		unifiedQueryParams.currencyType = 'exalted_divine';
		unifiedQueryParams.offline = 'securable';
		unifiedQueryParams.minItemLevel = lines.map(l => l.match(/Item Level: (\d+)/)).find(v => v)?.[1];
		unifiedQueryParams.rarity = 'normal';
		unifiedQueryParams.minQuality = lines.map(l => l.match(/Quality: \+(\d+)/)).find(v => v)?.[1];
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

		let unifiedQueryParams = new UnifiedQueryParams();
		unifiedQueryParams.name = await apiConstants.nameToItem(lines[2]);
		unifiedQueryParams.currencyType = 'exalted_divine';
		unifiedQueryParams.offline = 'securable';

		let propertyTexts = await apiConstants.propertyTexts();
		let matchedPropertyTextWeights = lines
			.map(line => {
				let weight = (line.match(/\d+(\.\d+)?/g) || []).reduce((sum, v, _, a) => sum + v / a.length, 0);
				line = escapeRegex(line)
					.replaceAll(/(\d+(\\\.\d+)?)/g, '($1|#)')
					.replaceAll(/\+/g, '+?')
					.replaceAll(/decrease|reduce/g, '(decrease|reduce|increase)');
				line = `(^|\n)${line}( \\(explicit\\))?($|\n)`;
				let regex = new RegExp(line);
				// todo[low] sometimes, there are multiple properties with the same text. should do an 'or' between them. e.g. '+# to Strength and Intelligence'
				let propertyText = propertyTexts.find(pt => pt.match(regex));
				return propertyText ? [propertyText, weight] : null;
			})
			.filter(m => m);

		unifiedQueryParams.andEntries =
			matchedPropertyTextWeights.map(([propertyText, weight]) =>
				new UnifiedQueryParams.Entry(propertyText, weight));

		return unifiedQueryParams;
	}
}

class PoeTradeApiTabletPricer extends PoeTradeApiPricer {
	get title() {
		return 'Tablet pricer';
	}

	createUnifiedQueryParams(lines) {
		return null;
		// let unifiedQueryParams = new UnifiedQueryParams();
		// return unifiedQueryParams;
	}
}

class PoeTradeApiWaystonePricer extends PoeTradeApiPricer {
	get title() {
		return 'Waystone pricer';
	}

	createUnifiedQueryParams(lines) {
		return null;
		// let unifiedQueryParams = new UnifiedQueryParams();
		// return unifiedQueryParams;
	}
}

let pricers = [
	...Poe2ScoutPricer.endpointTypes.map(endpointType => new Poe2ScoutPricer(endpointType)),
	new PoeTradeApiNormalBasePricer(),
	new PoeTradeApiExceptionalBasePricer(),
	new PoeTradeApiFlaskPricer(),
	new PoeTradeApiTabletPricer(),
	new PoeTradeApiWaystonePricer(),
];

let getPrice = async text =>
	(await Promise.allSettled(pricers.map(pricer => pricer.getPrice(text.trim()))))
		.filter(p => p.status === 'fulfilled')
		.map(p => p.value)
		.map(join('----'))
		.flat(2);

module.exports = {getPrice};

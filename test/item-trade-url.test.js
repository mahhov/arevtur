const {describe, it} = require('node:test');
const assert = require('node:assert');
const path = require('path');

// Mock apiConstants before requiring itemTradeUrl
const apiConstantsPath = path.resolve(__dirname, '../src/services/apiConstants.js');
require.cache[apiConstantsPath] = {
	id: apiConstantsPath, filename: apiConstantsPath, loaded: true,
	exports: {api: 'https://www.pathofexile.com'},
};

const {buildItemTradeUrl} = require('../src/services/tradeQuery/itemTradeUrl');

describe('buildItemTradeUrl', () => {
	const baseItem = {
		subtype: 'Sorcerer Boots',
		rarity: 'Rare',
		name: 'Doom Trail',
		accountText: 'TestAccount > CharName',
		listingCurrency: 'chaos',
		listingAmount: 50,
		queryStats: [{type: 'and', filters: [{id: 'pseudo.pseudo_total_life', value: {min: 80}}]}],
	};

	it('includes item base type', () => {
		let url = buildItemTradeUrl(false, 'Standard', baseItem);
		let query = extractQuery(url);
		assert.strictEqual(query.type, 'Sorcerer Boots');
	});

	it('includes seller account name without character', () => {
		let url = buildItemTradeUrl(false, 'Standard', baseItem);
		let query = extractQuery(url);
		assert.strictEqual(query.filters.trade_filters.filters.account.input, 'TestAccount');
	});

	it('includes exact price filter', () => {
		let url = buildItemTradeUrl(false, 'Standard', baseItem);
		let query = extractQuery(url);
		let price = query.filters.trade_filters.filters.price;
		assert.strictEqual(price.min, 50);
		assert.strictEqual(price.max, 50);
		assert.strictEqual(price.option, 'chaos');
	});

	it('includes query stats from original search', () => {
		let url = buildItemTradeUrl(false, 'Standard', baseItem);
		let query = extractQuery(url);
		assert.deepStrictEqual(query.stats, baseItem.queryStats);
	});

	it('includes item name for uniques', () => {
		let uniqueItem = {...baseItem, rarity: 'Unique', name: 'Headhunter'};
		let url = buildItemTradeUrl(false, 'Standard', uniqueItem);
		let query = extractQuery(url);
		assert.strictEqual(query.name, 'Headhunter');
	});

	it('does not include item name for rares', () => {
		let url = buildItemTradeUrl(false, 'Standard', baseItem);
		let query = extractQuery(url);
		assert.strictEqual(query.name, undefined);
	});

	it('uses PoE 1 endpoint for version2=false', () => {
		let url = buildItemTradeUrl(false, 'Standard', baseItem);
		assert.ok(url.includes('/trade/search/Standard'));
		assert.ok(!url.includes('trade2'));
	});

	it('uses PoE 2 endpoint for version2=true', () => {
		let url = buildItemTradeUrl(true, 'Standard', baseItem);
		assert.ok(url.includes('/trade2/search/poe2/Standard'));
	});

	it('omits price filter when no listing data', () => {
		let noPriceItem = {...baseItem, listingCurrency: undefined, listingAmount: undefined};
		let url = buildItemTradeUrl(false, 'Standard', noPriceItem);
		let query = extractQuery(url);
		assert.strictEqual(query.filters.trade_filters.filters.price, undefined);
	});

	it('falls back to empty stats when queryStats missing', () => {
		let noStatsItem = {...baseItem, queryStats: undefined};
		let url = buildItemTradeUrl(false, 'Standard', noStatsItem);
		let query = extractQuery(url);
		assert.deepStrictEqual(query.stats, [{type: 'and', filters: []}]);
	});
});

function extractQuery(url) {
	let qParam = new URL(url).searchParams.get('q');
	return JSON.parse(qParam).query;
}

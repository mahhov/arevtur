const {describe, it, beforeEach} = require('node:test');
const assert = require('node:assert');

// Mock apiConstants before requiring UnifiedQueryParams
const path = require('path');
const apiConstantsPath = path.resolve(__dirname, '../src/services/apiConstants.js');
const apiConstantsMock = {
	propertyByText: async text => ({id: `mock.${text}`, text}),
	propertyById: async id => ({id, text: id.replace('mock.', '')}),
	typeTextToId: async text => text === 'Any' ? undefined : text,
	typeIdToText: async id => id || 'Any',
	sort: {value: {'statgroup.0': 'desc'}, price: {price: 'asc'}},
	nameToItem: async name => name,
	parsePropertyCopyText: async () => null,
};
require.cache[apiConstantsPath] = {id: apiConstantsPath, filename: apiConstantsPath, loaded: true, exports: apiConstantsMock};

const jsDesktopBasePath = require.resolve('js-desktop-base');
require.cache[jsDesktopBasePath] = {id: jsDesktopBasePath, filename: jsDesktopBasePath, loaded: true, exports: {httpRequest: () => {}, XPromise: class {}}};

const UnifiedQueryParams = require('../src/services/UnifiedQueryParams');

describe('status-filter feature', () => {
	describe('statusFilter logic (Results.js)', () => {
		// Replicate the statusFilter function from Results.js for unit testing
		function statusFilter(item, filter) {
			if (filter === 'all') return true;
			if (filter === 'no-offline') return item.onlineStatus !== 'offline';
			if (filter === 'no-afk') return item.onlineStatus === 'instant buyout' || item.onlineStatus === 'online';
			if (filter === 'buyout-only') return item.onlineStatus === 'instant buyout';
			return true;
		}

		const items = [
			{onlineStatus: 'instant buyout'},
			{onlineStatus: 'online'},
			{onlineStatus: 'afk'},
			{onlineStatus: 'offline'},
		];

		it('filter "all" shows all items', () => {
			const result = items.filter(i => statusFilter(i, 'all'));
			assert.strictEqual(result.length, 4);
		});

		it('filter "no-offline" hides offline items', () => {
			const result = items.filter(i => statusFilter(i, 'no-offline'));
			assert.strictEqual(result.length, 3);
			assert.ok(result.every(i => i.onlineStatus !== 'offline'));
		});

		it('filter "no-afk" shows only instant buyout and online', () => {
			const result = items.filter(i => statusFilter(i, 'no-afk'));
			assert.strictEqual(result.length, 2);
			assert.ok(result.some(i => i.onlineStatus === 'instant buyout'));
			assert.ok(result.some(i => i.onlineStatus === 'online'));
		});

		it('filter "buyout-only" shows only instant buyout', () => {
			const result = items.filter(i => statusFilter(i, 'buyout-only'));
			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0].onlineStatus, 'instant buyout');
		});
	});

	describe('toTradeQueryData respects localStorage status filter', () => {
		// Set up a fake localStorage for the module
		beforeEach(() => {
			global.localStorage = {
				_data: {},
				getItem(key) { return this._data[key] ?? null; },
				setItem(key, value) { this._data[key] = value; },
			};
		});

		it('default (no filter) generates queries with all offline options', () => {
			const params = new UnifiedQueryParams();
			params.maxPrice = 100;
			const queries = params.toTradeQueryData('6-link', 1500);
			const offlineValues = [...new Set(queries.map(q => q.offline))];
			assert.ok(offlineValues.includes('securable'));
			assert.ok(offlineValues.includes('online'));
			assert.ok(offlineValues.includes('any'));
		});

		it('filter "no-offline" limits offline options to securable and online', () => {
			global.localStorage.setItem('results-status-filter', 'no-offline');
			const params = new UnifiedQueryParams();
			params.maxPrice = 100;
			const queries = params.toTradeQueryData('6-link', 1500);
			const offlineValues = [...new Set(queries.map(q => q.offline))];
			assert.ok(offlineValues.includes('securable'));
			assert.ok(offlineValues.includes('online'));
			assert.ok(!offlineValues.includes('any'));
		});

		it('filter "no-afk" limits offline options to securable and online', () => {
			global.localStorage.setItem('results-status-filter', 'no-afk');
			const params = new UnifiedQueryParams();
			params.maxPrice = 100;
			const queries = params.toTradeQueryData('6-link', 1500);
			const offlineValues = [...new Set(queries.map(q => q.offline))];
			assert.ok(offlineValues.includes('securable'));
			assert.ok(offlineValues.includes('online'));
			assert.ok(!offlineValues.includes('any'));
		});

		it('filter "buyout-only" limits offline options to securable only', () => {
			global.localStorage.setItem('results-status-filter', 'buyout-only');
			const params = new UnifiedQueryParams();
			params.maxPrice = 100;
			const queries = params.toTradeQueryData('6-link', 1500);
			const offlineValues = [...new Set(queries.map(q => q.offline))];
			assert.ok(offlineValues.includes('securable'));
			assert.ok(!offlineValues.includes('online'));
			assert.ok(!offlineValues.includes('any'));
		});
	});

	describe('ItemData.onlineStatus', () => {
		// Replicate the static method for unit testing
		function onlineStatus(onlineObj, travelHideoutToken, queryNotes) {
			if (travelHideoutToken || queryNotes?.some(note => note === 'online: securable'))
				return 'instant buyout';
			if (!onlineObj)
				return 'offline';
			if (onlineObj.status)
				return onlineObj.status;
			return 'online';
		}

		it('returns "instant buyout" when travelHideoutToken is present', () => {
			assert.strictEqual(onlineStatus(null, 'token123', null), 'instant buyout');
		});

		it('returns "instant buyout" when queryNotes includes "online: securable"', () => {
			assert.strictEqual(onlineStatus(null, null, ['online: securable']), 'instant buyout');
		});

		it('returns "offline" when onlineObj is null/undefined', () => {
			assert.strictEqual(onlineStatus(null, null, null), 'offline');
		});

		it('returns "afk" when onlineObj.status is "afk"', () => {
			assert.strictEqual(onlineStatus({status: 'afk'}, null, null), 'afk');
		});

		it('returns "online" when onlineObj exists without status', () => {
			assert.strictEqual(onlineStatus({}, null, null), 'online');
		});
	});
});

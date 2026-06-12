const {describe, it, beforeEach} = require('node:test');
const assert = require('node:assert');

// Mock apiConstants before requiring UnifiedQueryParams
const apiConstantsMock = {
	propertyByText: async text => ({id: `mock.${text}`, text}),
	propertyById: async id => ({id, text: id.replace('mock.', '')}),
	typeTextToId: async text => text === 'Any' ? undefined : text,
	typeIdToText: async id => id || 'Any',
	sort: {value: {'statgroup.0': 'desc'}, price: {price: 'asc'}},
	nameToItem: async name => name,
	parsePropertyCopyText: async () => null,
};

// Replace the module in require cache
const path = require('path');
const apiConstantsPath = path.resolve(__dirname, '../src/services/apiConstants.js');
require.cache[apiConstantsPath] = {id: apiConstantsPath, filename: apiConstantsPath, loaded: true, exports: apiConstantsMock};

// Also mock js-desktop-base and node-fetch to prevent network calls
const jsDesktopBasePath = require.resolve('js-desktop-base');
require.cache[jsDesktopBasePath] = {id: jsDesktopBasePath, filename: jsDesktopBasePath, loaded: true, exports: {httpRequest: () => {}, XPromise: class {}}};

const properties = require('../src/arevtur/xElements/inputTradeParams/properties');
const UnifiedQueryParams = require('../src/services/UnifiedQueryParams');

describe('min-level-requirement feature', () => {
	describe('properties.js exports', () => {
		it('exports minRequirementPropertyTuples', () => {
			assert.ok(Array.isArray(properties.minRequirementPropertyTuples));
			assert.strictEqual(properties.minRequirementPropertyTuples.length, 1);
			assert.deepStrictEqual(properties.minRequirementPropertyTuples[0], ['minLevelRequirement', '#min-level-requirement-input']);
		});

		it('exports maxRequirementPropertyTuples separately', () => {
			assert.ok(Array.isArray(properties.maxRequirementPropertyTuples));
			assert.ok(properties.maxRequirementPropertyTuples.some(([key]) => key === 'maxLevelRequirement'));
			// minLevelRequirement should NOT be in maxRequirementPropertyTuples
			assert.ok(!properties.maxRequirementPropertyTuples.some(([key]) => key === 'minLevelRequirement'));
		});
	});

	describe('UnifiedQueryParams constructor', () => {
		it('initializes minRequirementProperties with minLevelRequirement = 0', () => {
			const params = new UnifiedQueryParams();
			assert.strictEqual(params.minRequirementProperties.minLevelRequirement, 0);
		});

		it('initializes maxRequirementProperties separately', () => {
			const params = new UnifiedQueryParams();
			assert.strictEqual(params.maxRequirementProperties.maxLevelRequirement, 0);
			assert.strictEqual(params.maxRequirementProperties.maxStrengthRequirement, 0);
		});
	});

	describe('toApiQueryParams', () => {
		it('includes lvl.min when minLevelRequirement > 0', async () => {
			const params = new UnifiedQueryParams();
			params.minRequirementProperties.minLevelRequirement = 60;
			const result = await params.toApiQueryParams(false);
			const reqFilters = result.query.filters.req_filters;
			assert.ok(reqFilters);
			assert.strictEqual(reqFilters.filters.lvl.min, 60);
		});

		it('includes both lvl.min and lvl.max when both are set', async () => {
			const params = new UnifiedQueryParams();
			params.minRequirementProperties.minLevelRequirement = 40;
			params.maxRequirementProperties.maxLevelRequirement = 70;
			const result = await params.toApiQueryParams(false);
			const lvl = result.query.filters.req_filters.filters.lvl;
			assert.strictEqual(lvl.min, 40);
			assert.strictEqual(lvl.max, 70);
		});

		it('omits req_filters when no requirements are set', async () => {
			const params = new UnifiedQueryParams();
			const result = await params.toApiQueryParams(false);
			assert.strictEqual(result.query.filters.req_filters, undefined);
		});

		it('includes only lvl.max when only maxLevelRequirement is set', async () => {
			const params = new UnifiedQueryParams();
			params.maxRequirementProperties.maxLevelRequirement = 50;
			const result = await params.toApiQueryParams(false);
			const lvl = result.query.filters.req_filters.filters.lvl;
			assert.strictEqual(lvl.min, undefined);
			assert.strictEqual(lvl.max, 50);
		});
	});

	describe('fromApiQueryParams', () => {
		it('parses lvl.min into minRequirementProperties', async () => {
			const apiData = {
				query: {
					filters: {
						req_filters: {filters: {lvl: {min: 55}}}
					}
				}
			};
			const params = await UnifiedQueryParams.fromApiQueryParams(apiData);
			assert.strictEqual(params.minRequirementProperties.minLevelRequirement, 55);
		});

		it('parses lvl.max into maxRequirementProperties', async () => {
			const apiData = {
				query: {
					filters: {
						req_filters: {filters: {lvl: {max: 80}}}
					}
				}
			};
			const params = await UnifiedQueryParams.fromApiQueryParams(apiData);
			assert.strictEqual(params.maxRequirementProperties.maxLevelRequirement, 80);
		});

		it('parses both lvl.min and lvl.max', async () => {
			const apiData = {
				query: {
					filters: {
						req_filters: {filters: {lvl: {min: 30, max: 60}}}
					}
				}
			};
			const params = await UnifiedQueryParams.fromApiQueryParams(apiData);
			assert.strictEqual(params.minRequirementProperties.minLevelRequirement, 30);
			assert.strictEqual(params.maxRequirementProperties.maxLevelRequirement, 60);
		});

		it('defaults to 0 when lvl filter is absent', async () => {
			const apiData = {query: {filters: {}}};
			const params = await UnifiedQueryParams.fromApiQueryParams(apiData);
			assert.strictEqual(params.minRequirementProperties.minLevelRequirement, 0);
			assert.strictEqual(params.maxRequirementProperties.maxLevelRequirement, 0);
		});
	});
});

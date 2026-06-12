const querystring = require('querystring');
const apiConstants = require('../apiConstants');

function buildItemTradeUrl(version2, league, itemData) {
	let query = {filters: {}, stats: itemData.queryStats || [{type: 'and', filters: []}]};

	// Item type
	if (itemData.subtype)
		query.type = itemData.subtype;

	// Item name (for uniques)
	if (itemData.rarity === 'Unique' && itemData.name)
		query.name = itemData.name;

	// Seller account + price range
	let tradeFilters = {
		account: {input: itemData.accountText.split(' > ')[0]},
	};
	if (itemData.listingCurrency && itemData.listingAmount) {
		tradeFilters.price = {
			min: itemData.listingAmount,
			max: itemData.listingAmount,
			option: itemData.listingCurrency,
		};
	}
	query.filters.trade_filters = {filters: tradeFilters};

	let endpoint = version2 ?
		`${apiConstants.api}/trade2/search/poe2/${league}` :
		`${apiConstants.api}/trade/search/${league}`;
	let queryParams = querystring.stringify({q: JSON.stringify({query})});
	return `${endpoint}?${queryParams}`;
}

module.exports = {buildItemTradeUrl};

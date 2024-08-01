const {httpRequest: {get, post}} = require('js-desktop-base');
const RateLimitedRetryQueue = require('./RateLimitedRetryQueue');
const Stream = require('./Stream');
// const ApiConstants = require('../arevtur/ApiConstants');

const SHORT_PROPERTIES = {
	totalEleRes: 'pseudo.pseudo_total_elemental_resistance',
	flatLife: 'pseudo.pseudo_total_life',
};

let parseRateLimitResponseHeader = ({rule, state}) => {
	let r = rule.split(':');
	let s = state.split(':');
	return `${s[0]} of ${r[0]} per ${r[1]} s. Timeout ${s[2]} of ${r[2]}`;
};

let getRateLimitHeaders = responseHeaders => {
	let rules = [
		...responseHeaders['x-rate-limit-account'].split(','),
		...responseHeaders['x-rate-limit-ip'].split(','),
	];
	let states = [
		...responseHeaders['x-rate-limit-account-state'].split(','),
		...responseHeaders['x-rate-limit-ip-state'].split(','),
	];
	return rules.map((rule, i) => ({rule, state: states[i]}));
};

let rlrGetQueue = new RateLimitedRetryQueue(667 * 1.2, [5000, 15000, 60000]);
let rlrPostQueue = new RateLimitedRetryQueue(1500 * 1.2, [5000, 15000, 60000]);

let rlrGet = (endpoint, queryParams, headers, stopObj) => rlrGetQueue.add(async () => {
	if (stopObj.stop)
		return;
	let g = await get(endpoint, queryParams, headers);
	let rateLimitStr = parseRateLimitResponseHeader(getRateLimitHeaders(g.response.headers)[0]);
	console.log('got, made requests', rateLimitStr);
	return g;
});

let rlrPost = (endpoint, query, headers, stopObj) => rlrPostQueue.add(async () => {
	if (stopObj.stop)
		return;
	let p = await post(endpoint, query, headers);
	let rateLimitStr = parseRateLimitResponseHeader(getRateLimitHeaders(p.response.headers)[0]);
	console.log('posted, made requests', rateLimitStr);
	return p;
});

class QueryParams2 {
	constructor(sessionId, league, searchBodyString, max) {
		this.sessionId = sessionId;
		this.league = league;
		this.searchBodyString = searchBodyString; // todo rename searchUrl
		this.max = max;
	}

	get headers() {
		// Without a non-empty user-agent header, PoE will return 403.
		return {'User-Agent': '_', Cookie: this.sessionId ? `POESESSID=${this.sessionId}` : ''};
	}

	static evalValue(pseudoMods) {
		let pseudoSumI = pseudoMods.findIndex(mod => mod.startsWith('Sum: '));
		if (pseudoSumI === -1)
			return 0;
		let [pseudoSum] = pseudoMods.splice(pseudoSumI, 1);
		return Number(pseudoSum.substring(5));
	}

	static async parseItem(itemData) {
		let sockets = (itemData.item.sockets || []).reduce((a, v) => {
			a[v.group] = a[v.group] || [];
			a[v.group].push(v.sColour);
			return a;
		}, []);
		let extendedExplicitMods = itemData.item.extended.mods?.explicit || [];
		let affixes = Object.fromEntries([['prefix', 'P'], ['suffix', 'S']].map(([prop, tier]) =>
			[prop, extendedExplicitMods.filter(mod => mod.tier[0] === tier).length]));
		let defenseProperties =
			[
				['ar', 'armour'],
				['ev', 'evasion'],
				['es', 'energyShield'],
			].map(([responseName, fullName]) => [fullName, itemData.item.extended[responseName] || 0])
				.filter(([_, value]) => value);
		let pseudoMods = itemData.item.pseudoMods || [];
		let valueDetails = {
			affixes: 0,
			defenses: 0,
			mods: QueryParams2.evalValue(pseudoMods),
		};
		let text = Buffer.from(itemData.item.extended.text, 'base64').toString();
		let valueBuild = Promise.resolve('');
		let priceDetails = {
			count: itemData.listing.price.amount,
			currency: itemData.listing.price.currency,
			shifts: {},
		};

		return {
			id: itemData.id,
			name: itemData.item.name,
			type: itemData.item.typeLine,
			itemLevel: itemData.item.ilvl,
			corrupted: itemData.item.corrupted,
			influences: Object.keys(itemData.item.influences || {}),
			sockets,
			affixes,
			defenseProperties: defenseProperties.map(nameValue => nameValue.join(' ')),
			enchantMods: itemData.item.enchantMods || [],
			implicitMods: itemData.item.implicitMods || [],
			explicitMods: itemData.item.explicitMods || [],
			craftedMods: itemData.item.craftedMods || [],
			pseudoMods,
			accountText: `${itemData.listing.account.name} > ${itemData.listing.account.lastCharacterName}`,
			whisper: itemData.listing.whisper,
			date: itemData.listing.indexed,
			note: itemData.item.note,
			evalValue: Object.values(valueDetails).reduce((sum, v) => sum + v),
			valueDetails,
			valueBuild,
			evalPrice: priceDetails.count,
			priceDetails,
			text,
			debug: itemData,
		};
	}

	getItemsStream(progressCallback) {
		this.stopObj = {};
		let stream = new Stream();
		this.writeItemsToStream(stream, progressCallback)
			.then(() => stream.done());
		return stream;
	}

	stop() {
		this.stopObj.stop = true;
	}

	async writeItemsToStream(stream, progressCallback) {
		let query = await this.getQuery();
		return await this.queryAndParseItems(query, stream, progressCallback);
	}

	async getQuery() {
		let response = await get(this.searchBodyString, {}, this.headers);
		let jsonString = response.string.match(/require.*main.*t\(\{((.|\n)*?)\}\);/)[1];
		let obj = JSON.parse(`{${jsonString}}`);
		return {
			query: obj.state,
			sort: {'statgroup.0': 'desc'},
		};
	}

	async queryAndParseItems(query, stream, progressCallback) {
		const api = 'https://www.pathofexile.com/api/trade';
		let endpoint = `${api}/search/${this.league}`;
		try {
			progressCallback('Initial query.', 0);
			let response = await rlrPost(endpoint, query, this.headers, this.stopObj);
			console.log('response.string', response.string);
			let data = JSON.parse(response.string);
			progressCallback(`Received ${data.result.length} items.`, 0);
			data.result = data.result.slice(0, this.max);

			let requestGroups = [];
			while (data.result.length)
				requestGroups.push(data.result.splice(0, 10));
			progressCallback(`Will make ${requestGroups.length} grouped item queries.`, 1 / (requestGroups.length + 1));

			let receivedCount = 0;
			let promises = requestGroups.map(async (requestGroup, i) => {
				let queryParams = {
					query: data.id,
					'pseudos[]': [SHORT_PROPERTIES.totalEleRes, SHORT_PROPERTIES.flatLife],
				};
				let endpoint2 = `${api}/fetch/${requestGroup.join()}`;
				let response2 = await rlrGet(endpoint2, queryParams, this.headers, this.stopObj);
				let data2 = JSON.parse(response2.string);
				progressCallback(`Received grouped item query # ${i}.`, (1 + ++receivedCount) / (requestGroups.length + 1));
				let items = await Promise.all(data2.result.map(async itemData => await QueryParams2.parseItem(itemData)));
				stream.write(items);
				return items;
			});
			let items = (await Promise.all(promises)).flat();
			progressCallback('All grouped item queries completed.', 1);
			return items;
		} catch (e) {
			console.warn('ERROR', e);
			return [];
		}
	}
}

module.exports = QueryParams2;

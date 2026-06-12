const configData = require('../config/configData');
const Cache = require('../../util/Cache');
const {get} = require('../../util/browserHttpRequest');

let endpointTypes = [
	['Currencies', 'currency'],
	['Currencies', 'fragments'],
	['Currencies', 'runes'],
	['Currencies', 'talismans'],
	['Currencies', 'essences'],
	['Currencies', 'ultimatum'],
	['Currencies', 'expedition'],
	['Currencies', 'ritual'],
	['Currencies', 'vaultkeys'],
	['Currencies', 'breach'],
	['Currencies', 'abyss'],
	['Currencies', 'uncutgems'],
	['Currencies', 'lineagesupportgems'],
	['Currencies', 'delirium'],
	['Currencies', 'incursion'],
	['Currencies', 'idol'],
	['Uniques', 'accessory'],
	['Uniques', 'armour'],
	['Uniques', 'flask'],
	['Uniques', 'jewel'],
	['Uniques', 'map'],
	['Uniques', 'weapon'],
	['Uniques', 'sanctum'],
];

let cache = new Cache(12 * 60 * 1000, endpoint =>
	get(endpoint).then(({string}) => JSON.parse(string)));

let getEndpoint = async endpointType => {
	let league = configData.config.league;
	let leagueData = await cache.get('https://api.poe2scout.com/poe2/Leagues');
	let leagueNickname = leagueData.find(data => data.Value === league).ShortName;
	return `https://api.poe2scout.com/poe2/Leagues/${leagueNickname}/${endpointType[0]}/ByCategory?Category=${endpointType[1]}&PerPage=250`;
};

let getData = async endpointType =>
	cache.get(await getEndpoint(endpointType));

module.exports = {endpointTypes, getEndpoint, getData};

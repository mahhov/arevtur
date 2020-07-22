const path = require('path');
const fs = require('fs').promises;
const envPaths = require('env-paths')('poe-pricer');

let getPath = fileName => path.resolve(envPaths.data, fileName);

let configPath = getPath('config.json');
let config;
try {
	config = require(configPath);
	// TODO FIX THIS IMMEDIATELY, THIS SHOULD BE IN SYNC WITH THE AREVTUR BROWSER WINDOW
	// This is a hacky fix for everyone who installed versions 4.0.2 or earlier.
	if (config.league === 'Delirium')
		config.league = 'Harvest';
} catch (e) {
	// For the first run, config.json won't exist. This is expected and ok.
	config = {
		league: 'Harvest',
		restrictToPoeWindow: true,
	};
}
let saveConfig = newConfig => {
	Object.assign(config, newConfig);
	fs.writeFile(configPath, JSON.stringify(config, '', 2));
};

module.exports = {
	basePath: envPaths.data,
	config,
	saveConfig,
	gmailCredentialsPath: path.join(__dirname, '../../resources/gmailCredentials.json'),
	gmailTokenPath: getPath('gmailToken.json'),
};

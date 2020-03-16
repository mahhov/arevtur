const path = require('path');
const fs = require('fs').promises;
const envPaths = require('env-paths')('poe-pricer');

let getPath = fileName => path.resolve(envPaths.data, fileName);

let configPath = getPath('config.json');
let config = require(configPath);
let saveConfig = newConfig => {
	Object.assign(config, newConfig);
	fs.writeFile(configPath, JSON.stringify(config, '', 2));
};

module.exports = {
	basePath: envPaths.data,
	config,
	saveConfig,
	gmailCredentialsPath: getPath('gmailCredentials.json'),
	gmailTokenPath: getPath('gmailToken.json'),
};

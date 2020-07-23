const path = require('path');
const envPaths = require('env-paths')('poe-pricer');

module.exports = {
	basePath: envPaths.data,
	configPath: path.resolve(envPaths.data, 'config.json'),
	gmailCredentialsPath: path.join(__dirname, '../../resources/gmailCredentials.json'),
	gmailTokenPath: path.resolve(envPaths.data, 'gmailToken.json'),
};

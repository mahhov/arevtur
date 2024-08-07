const path = require('path');
const envPaths = require('env-paths')('poe-pricer');

module.exports = {
	basePath: envPaths.data,
	configPath: path.resolve(envPaths.data, 'config.json'),
};

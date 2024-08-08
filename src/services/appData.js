const path = require('path');
const envPaths = require('env-paths')('arevtur');

module.exports = {
	basePath: envPaths.data,
	configPath: path.resolve(envPaths.data, 'config.json'),
	isDev: !!process.env.npm_command,
};

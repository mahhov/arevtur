const path = require('path');
const os = require('os');
const envPaths = require('env-paths')('arevtur');

module.exports = {
	basePath: envPaths.data,
	configPath: path.resolve(envPaths.data, 'config.json'),
	isDev: !!process.env.npm_command,
	defaultPobPath: os.platform() === 'linux' ?
		'/var/lib/flatpak/app/community.pathofbuilding.PathOfBuilding/current/active/files/pathofbuilding/src' :
		path.resolve(process.env.APPDATA, 'Path of Building Community'),
	defaultPobBuildsPath: os.platform() === 'linux' ?
		path.resolve(require('os').homedir(),
			'/.var/app/community.pathofbuilding.PathOfBuilding/data/pobfrontend/Path of Building/Builds/') :
		path.resolve(require('os').homedir(), 'Documents/Path of Building'),
};

const path = require('path');
const os = require('os');
const envPaths = require('env-paths')('arevtur', {suffix: ''});

module.exports = {
	basePath: envPaths.config,
	configPath: path.resolve(envPaths.config, 'config.json'),
	bugReportPath: path.resolve(envPaths.config, 'bugReport.json'),

	isDev: !!process.env.npm_command,

	defaultPobPath: os.platform() === 'linux' ?
		'/var/lib/flatpak/app/community.pathofbuilding.PathOfBuilding/current/active/files/pathofbuilding/src' :
		path.resolve(process.env.APPDATA, 'Path of Building Community'),
	defaultPobBuildsPath: os.platform() === 'linux' ?
		path.resolve(os.homedir(),
			'/.var/app/community.pathofbuilding.PathOfBuilding/data/pobfrontend/Path of Building/Builds/') :
		path.resolve(os.homedir(), 'Documents/Path of Building'),
};

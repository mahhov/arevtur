const os = require('os');
const {app, ipcMain} = require('electron');
const {httpRequest: {post2}} = require('js-desktop-base');
const config = require('./config');
const appData = require('../services/appData');

let randId = () => Math.floor(Math.random() * 1000 ** 2) + 1;

let debug = appData.isDev;
let endpoint = `https://www.google-analytics.com/${debug ? 'debug/' : ''}mp/collect`;
let apiSecret = 'B3I4WMgISoWkw-MNBv7mtw';
let measurementId = 'G-4F5V3VE4B6';
let clientId = 'arevtur-app';
let sessionId = randId();

if (!config.config.gaUserId)
	config.updateConfig({gaUserId: randId()});
let gaUserId = config.config.gaUserId;
config.addListener('change', config => gaUserId = config.gaUserId);

let emit = async (eventName, eventParams) => {
	let body = {
		client_id: clientId,
		user_id: String(gaUserId),
		// user_properties: {
		// 	custom_env: {
		// 		os: String(app.getVersion()),
		// 		version: app.getVersion(),
		// 	},
		// },
		events: [{
			name: eventName,
			params: {
				...eventParams,
				session_id: sessionId,
			},
		}],
	};
	console.log('google analytics logging:', eventName, JSON.stringify(body));
	let response = await post2(endpoint, {
		api_secret: apiSecret,
		measurement_id: measurementId,
	}, body);
	if (debug) {
		let responseObj = JSON.parse(response.string);
		if (responseObj.validationMessages.length)
			console.error('google analytics error', responseObj.validationMessages);
	}
};

// todo[blocking] get logging for renderer process
module.exports = {
	emit,
	emitStartup: () =>
		emit('startup', {
			os: app.getVersion(),
			version: app.getVersion(),
			league: config.config.league,
			restrictToPoeWindow: config.config.restrictToPoeWindow,
			darkTheme: config.config.darkTheme,
			viewHorizontal: config.config.viewHorizontal,
			viewMaximize: config.config.viewMaximize,
			// don't log paths, since that might contains usernames which is sensitive
			buildParamsWeightsLife: config.config.buildParams.weights.life,
			buildParamsWeightsResist: config.config.buildParams.weights.resist,
			buildParamsWeightsDamage: config.config.buildParams.weights.damage,
			buildParamsWeightsStr: config.config.buildParams.weights.str,
			buildParamsWeightsDex: config.config.buildParams.weights.dex,
			buildParamsWeightsInt: config.config.buildParams.weights.int,
		}),
	// todo[blocking] start using this
	featureUsed: featureName => emit('feature_used', {featureName}),
};

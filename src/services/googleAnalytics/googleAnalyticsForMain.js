const os = require('os');
const {ipcMain, app} = require('electron');
const {httpRequest: {post2}} = require('js-desktop-base');
const config = require('../config');
const appData = require('../appData');
const {flattenObject} = require('../../util/util');

let randId = () => Math.floor(Math.random() * 1000 ** 2) + 1;

let debug = appData.isDev;
debug = false;
let endpoint = `https://www.google-analytics.com/${debug ? 'debug/' : ''}mp/collect`;
let apiSecret = 'B3I4WMgISoWkw-MNBv7mtw';
let measurementId = 'G-4F5V3VE4B6';
let clientId = 'arevtur-app';

class GoogleAnalyticsForMain {
	constructor() {
		this.sessionId = randId();

		if (!config.config.gaUserId)
			config.updateConfig({gaUserId: randId()});

		ipcMain.handle('ga-emit', (event, [eventName, eventParams]) =>
			this.emit(eventName, eventParams));
	}

	async emit(eventName, eventParams) {
		let body = {
			client_id: clientId,
			user_id: String(config.config.gaUserId),
			events: [{
				name: eventName,
				params: {
					...flattenObject(eventParams),
					session_id: this.sessionId,
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
	}

	emitStartup() {
		this.emit('startup', {
			os: os.platform(),
			version: app.getVersion(),
			config: config.config,
		});
	}
}

module.exports = new GoogleAnalyticsForMain();

const os = require('os');
const {ipcMain, app} = require('electron');
const {httpRequest: {post2}} = require('js-desktop-base');
const configForMain = require('../config/configForMain');
const appData = require('../appData');
const {flattenObject, randId} = require('../../util/util');

let debug = appData.isDev;
let endpoint = `https://www.google-analytics.com/${debug ? 'debug/' : ''}mp/collect`;
let apiSecret = 'B3I4WMgISoWkw-MNBv7mtw';
let measurementId = 'G-4F5V3VE4B6';
let clientId = 'arevtur-app';

class GoogleAnalyticsForMain {
	constructor() {
		this.sessionId = randId();
		ipcMain.handle('ga-emit', (event, [eventName, eventParams]) =>
			this.emit(eventName, eventParams));
	}

	async emit(eventName, eventParams = undefined) {
		let body = {
			client_id: clientId,
			user_id: configForMain.config.userId,
			events: [{
				name: eventName,
				params: {
					...flattenObject(eventParams),
					session_id: this.sessionId,
				},
			}],
		};
		// console.log('google analytics logging:', eventName, JSON.stringify(body));
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
			config: configForMain.config,
		});
	}
}

module.exports = new GoogleAnalyticsForMain();

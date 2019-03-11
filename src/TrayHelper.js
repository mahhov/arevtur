const {Menu, Tray} = require('electron');
const appReadyPromise = require('./appReadyPromise');

let trays = [];

class TrayHelper {
	static async createExitTray(icon, tooltip) {
		await appReadyPromise;
		let tray = new Tray(icon);
		tray.setToolTip(tooltip);
		tray.setContextMenu(Menu.buildFromTemplate([
			{label: 'Exit', type: 'normal', role: 'quit'},
		]));
		trays.push(tray); // https://electronjs.org/docs/faq#my-apps-windowtray-disappeared-after-a-few-minutes
	}
}

module.exports = TrayHelper;

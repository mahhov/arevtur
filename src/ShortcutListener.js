const {globalShortcut} = require('electron');
const appReadyPromise = require('./appReadyPromise');

class ShortcutListener {
	static async add(keyCombo, handler) {
		await appReadyPromise;
		globalShortcut.register(keyCombo, handler);
	}
}

module.exports = ShortcutListener;

const appReadyPromise = require('./appReadyPromise');
const screen = appReadyPromise.then(() => require('electron').screen);

class ScreenMouse {
	static async getMouse() {
		return (await screen).getCursorScreenPoint();
	}

	static async getScreenBounds() {
		return (await screen).getPrimaryDisplay().bounds;
	}
}

module.exports = ScreenMouse;

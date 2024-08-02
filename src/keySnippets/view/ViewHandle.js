const path = require('path');
const {ViewHandle: ViewHandleBase, ScreenMouse} = require('js-desktop-base');

class ViewHandle extends ViewHandleBase {
	constructor() {
		super({
			frame: false,
			thickFrame: false,
			skipTaskbar: true,
			alwaysOnTop: true,
			focusable: true,
			show: false,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
			},
		}, path.join(__dirname, './View.html'));
	}

	onMessage(message) {
		switch (message.name) {
			case 'close':
				this.hide();
				break;
			case 'prevent-close':
				clearInterval(this.timedHide);
				break;
			default:
				console.error('Unknown window message:', message);
		}
	}

	async moveToMouse() {
		let mouse = await ScreenMouse.getMouse();
		await this.move(mouse.x, mouse.y);
	}

	async showCommand(commandName, commandData, duration, widthPx, heightLines) {
		this.send({name: commandName, ...commandData});
		await this.show(duration);
		await this.resize(widthPx, 20 + 20 * heightLines);
		await this.moveToMouse();
		await this.validateOnScreen();
	}

	async showTexts(texts, duration) {
		this.showCommand('setTexts', {texts}, duration, 300, texts.length);
	}

	async showTable(rows, duration) {
		this.showCommand('setTable', {rows}, duration, 600, rows.length);
	}

	async showPreferences() {
		this.showCommand('showPreferences', {}, undefined, 300, 5);
	}
}

module.exports = ViewHandle;

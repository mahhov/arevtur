const path = require('path');
const {ViewHandle: ViewHandleBase, ScreenMouse} = require('js-desktop-base');
const pobApi = require('../../pobApi/pobApi');

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

		this.window.then(window => window.on('close', e => {
			e.preventDefault();
			window.hide();
		}));
	}

	onMessage(message) {
		switch (message.name) {
			case 'close':
				this.hide();
				break;
			case 'prevent-close':
				clearInterval(this.timedHide);
				break;
			case 'reset-pob':
				// todo[low] merge this file with keySnippet
				pobApi.setParams();
				break;
			case 'size':
				this.resize(600, message.height);
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
		heightLines = Math.min(heightLines, 40);
		this.send({name: commandName, ...commandData});
		await this.show(duration);
		await this.resize(widthPx, Math.ceil(22.17 + 18.27 * heightLines));
		await this.moveToMouse();
		await this.validateOnScreen();
	}

	async showText(text, duration) {
		this.showCommand('setText', {text}, duration, 600, text.split('\n').length);
	}

	async showTable(rows, duration) {
		this.showCommand('setTable', {rows}, duration, 600, rows.length);
	}

	async showDevOptions() {
		this.showCommand('showDevOptions', {}, undefined, 300, 5);
	}
}

module.exports = ViewHandle;

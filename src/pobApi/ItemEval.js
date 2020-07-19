const path = require("path");
const {spawn} = require("child_process");
const {CustomOsScript} = require('js-desktop-base');

class ItemEval extends CustomOsScript {
	constructor() {
		super();
		this.pendingResponses = [];
		this.readyPromise = new Promise(r => this.pendingResponses.push(r));
		this.addListener(({out}) => this.pendingResponses.shift()(out));
	}

	spawnProcess() {
		return spawn(
			path.resolve('./src/pobApi/luajit.exe'),
			[path.resolve('./src/pobApi/itemEcho.lua')],
			{cwd: path.resolve('C:/Users/manukh/Downloads/PathOfBuilding-1.4.170')});
	}

	get ready() {
		return this.readyPromise;
	}

	exit() {
		this.send('<exit>');
	}

	setBuild(path) {
		this.send(`<build> ${path}`);
	}

	evalItem(item) {
		this.send(`<item> ${item.replace(/[\n\r]+/g, ' \\n ')}`);
		return new Promise(r => this.pendingResponses.push(r))
			.then(text => ItemEval.clean(text))
			.then(text => text.split('\n'));
	}

	evalItemModDpsLife(itemMod) {
		this.send(`<item> TEST \\n Small Life Flask \\n ${itemMod}`);
		return new Promise(r => this.pendingResponses.push(r))
			.then(text => ItemEval.clean(text))
			.then(text => ({
				dps: Number(text.match(/Total DPS \(([+-][\d.]+)%\)/)?.[1]) || 0,
				life: Number(text.match(/([+-]\d+) Total Life/)?.[1]) || 0,
			}));
	}

	static clean(outString) {
		console.log('clean', outString)
		return outString
			.replace(/\^x[\dA-F]{6}/g, '')
			.replace(/\^\d/g, '')
			.replace(/\r/g, '');
	}

	static decode64(string64) {
		return Buffer.from(string64, 'base64').toString();
	}
}

module.exports = ItemEval;


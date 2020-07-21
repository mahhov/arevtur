const path = require("path");
const {spawn} = require("child_process");
const {CustomOsScript} = require('js-desktop-base');

class ItemEval extends CustomOsScript {
	constructor(pobPath) {
		super(pobPath);
		this.pendingResponses = [];
		this.readyPromise = new Promise(r => this.pendingResponses.push(r));
		this.addListener(({out, err}) => {
			if (err)
				console.error(err);
			if (!this.exited && out)
				out.split('::end::')
					.filter((_, i, a) => i !== a.length - 1) // filter trailing element; e.g. 'a,b,'.split(',') === ['a', 'b', '']
					.forEach(split => this.pendingResponses.shift()(split))
		});
	}

	spawnProcess(pobPath) {
		return spawn(
			path.resolve('./src/pobApi/luajit.exe'),
			[path.resolve('./src/pobApi/itemEcho.lua')],
			{cwd: path.resolve(pobPath)});
	}

	get ready() {
		return this.readyPromise;
	}

	exit() {
		this.exited = true;
		this.send('<exit>');
	}

	set build(path) {
		this.send(`<build> ${path}`);
	}

	set valueParams(valueParams) {
		this.valueParams_ = valueParams;
	}

	evalItem(item) {
		this.send(`<item> ${item.replace(/[\n\r]+/g, ' \\n ')}`);
		return new Promise(r => this.pendingResponses.push(r))
			.then(text => ItemEval.clean(text));
	}

	evalItemModSummary(itemMod, pluginNumber = 1) {
		itemMod = itemMod
			.replace(/^#(?!%)/, `+${pluginNumber}`)
			.replace(/#/g, pluginNumber)
			.replace(/\([^)]*\)/g, '')
			.replace(/total/gi, '')
			.replace(/increased .*damage/i, 'increased damage')
		this.send(`<mod> ${itemMod}`);
		return new Promise(r => this.pendingResponses.push(r))
			.then(text => ItemEval.clean(text))
			.then(text => {
				let dps = Number(text.match(/Total DPS \(([+-][\d.]+)%\)/)?.[1]) || 0;
				let life = Number(text.match(/([+-]\d+) Total Life/)?.[1]) || 0;
				let resistRegex = /([+-]\d+)% (?:fire|lightning|cold) Res(?:\.|istance)/i;
				let resist = text.match(new RegExp(resistRegex, 'gi'))?.reduce((sum, m) =>
					sum + Number(m.match(resistRegex)[1]), 0) || 0;
				let value = Math.round((dps * 80 / 3 * (this.valueParams_?.dps || 1) +
					life * (this.valueParams_?.life || 1) +
					resist / 3 * (this.valueParams_?.resist || 1)) /
					pluginNumber * 100) / 100;
				return {dps, life, resist, value, itemMod, text};
			});
	}

	static clean(outString) {
		return outString
			.replace(/\^x[\dA-F]{6}/g, '')
			.replace(/\^\d/g, '')
			.replace(/\r/g, '')
			.trim();
	}

	static decode64(string64) {
		return Buffer.from(string64, 'base64').toString()
	};
}

module.exports = ItemEval;

const path = require('path');
const {spawn} = require('child_process');
const {CustomOsScript, XPromise} = require('js-desktop-base');
const ApiConstants = require('../arevtur/ApiConstants');
const Emitter = require('../Emitter');

class Script extends CustomOsScript {
	constructor(pobPath) {
		super(pobPath);
	}

	spawnProcess(pobPath) {
		return spawn(
			'luajit',
			[path.join(__dirname, './pobApi.lua')],
			{cwd: pobPath});
	}
}

class PobApi extends Emitter {
	constructor() {
		super();
		this.script = null;
		this.build_ = null;
		this.valueParams = {
			life: 0,
			resist: 0,
			dps: 0,
		};
		this.pendingResponses = [];
		this.cache = {};
	}

	onScriptResponse({out, err, exit}) {
		if (exit) {
			// todo turn pob status red on crash and only restart if user clicks pob red icon
			console.error('PobApi process exited, starting new process');
			this.emit('not-ready');
			this.script.restartProcess();
			this.pendingResponses.forEach(pendingResponse => pendingResponse.reject());
			this.pendingResponses = [];
			this.refreshBuild();
		}
		if (err)
			console.error(err);
		if (out) {
			console.log('pobApi.lua: ', out.slice(0, 100), this.pendingResponses.length);
			out.split('.>')
				.map(split => split.split('<.')[1])
				.filter((_, i, a) => i !== a.length -
					1) // filter trailing element; e.g. 'a,b,'.split(',') === ['a', 'b', '']
				.forEach(split => this.pendingResponses.shift().resolve(split));
			if (!this.pendingResponses.length)
				this.emit('ready');
		}
	}

	send(cache, ...args) {
		if (!this.script)
			return Promise.reject();

		let text = args.map(arg => `<${arg}>`).join(' ');
		console.log('PobApi sending:', text, this.pendingResponses.length);

		if (this.cache[text])
			return this.cache[text];

		this.emit('busy');
		this.script.send(text);
		let promise = new XPromise();
		if (cache)
			this.cache[text] = promise;
		this.pendingResponses.push(promise);
		return promise;
	}

	set pobPath(path) {
		// e.g.
		// /var/lib/flatpak/app/community.pathofbuilding.PathOfBuilding/current/active/files/pathofbuilding/src
		this.script = new Script(path);
		this.script.addListener(response => this.onScriptResponse(response));
		this.pendingResponses.forEach(pendingResponse => pendingResponse.reject());
		this.pendingResponses = [];
		this.refreshBuild();
		this.emit('change');
	}

	set build(path) {
		// e.g. '~/.var/app/community.pathofbuilding.PathOfBuilding/data/pobfrontend/Path of
		// Building/Builds/cobra lash.xml'
		this.build_ = path;
		if (path) {
			this.send(false, 'build', path).then(() => {
				this.cache = {};
				this.emit('change');
				this.emit('ready');
			});
		}
	}

	refreshBuild() {
		this.build = this.build_;
	}

	set valueParams(valueParams) {
		this.valueParams_ = valueParams;
		this.emit('change');
	}

	evalItem(item) {
		return this.send(true, 'item', item.replace(/[\n\r]+/g, ' \\n '))
			.then(text => this.parseItemTooltip(text));
	}

	async evalItemModSummary(type = undefined, itemMod = undefined, pluginNumber = 1, raw = false) {
		// todo use mods' median values instead of pluginNumber = 100 [high]
		let pobType = await PobApi.getPobType(type);
		if (!pobType || !itemMod)
			return Promise.reject();
		// todo is this cleaning necessary? does it cause inaccuracies? [high]
		let cleanItemMod = raw ? itemMod : itemMod
			.replace(/^#(?!%)/, `+${pluginNumber}`) // prepend '+' if no '%' after '#'
			.replace(/^\+#%/, `${pluginNumber}%`) // remove '+' if '%' after '#'
			.replace(/#/g, pluginNumber) // pluginNumber
			.replace(/\([^)]*\)/g, '') // remove '(...)'
			.replace(/total/gi, '') // remove 'total'
			.replace(/increased .*damage/i, 'increased damage') // inc damage
			.replace(/% (?!increased)(.* speed)/i,
				(_, m) => `% increased ${m}`) // add 'increased' to '% .* speed'
			.replace(/\s+/g, ' ') // clean up whitespace
			.trim();
		return this.send(true, 'mod', cleanItemMod, pobType)
			.then(text => this.parseItemTooltip(text, 1 / pluginNumber, cleanItemMod));
	}

	async generateQuery(type = undefined, maxPrice = 10) {
		let pobType = await PobApi.getPobType(type);
		if (!pobType)
			return Promise.reject();
		return this.send(true, 'generateQuery', pobType, maxPrice, this.valueParams_.life,
			this.valueParams_.resist, this.valueParams_.dps);
	}

	static async getPobType(type = undefined) {
		return ApiConstants.POB_TYPES[await ApiConstants.constants.typeTextToId(type)];
	}

	parseItemTooltip(itemText, valueScale = 1, textPrefix = '') {
		itemText = PobApi.clean(itemText);

		let effectiveHitPoolRegex = /effective hit pool \(([+-][\d.]+)%\)/i;
		let flatLifeRegex = /([+-][\d,]+) total life/i;
		let anyResistRegex = /([+-]\d+)% (?:fire|lightning|cold|chaos) res(?:\.|istance)/i;
		let fullDpsRegex = /full dps \(([+-][\d.]+)%\)/i;

		let effectiveHitPool = Number(itemText.match(effectiveHitPoolRegex)?.[1]) || 0;
		let flatLife = Number(itemText.match(flatLifeRegex)?.[1].replace(/,/g, '')) || 0;
		let totalResist = itemText
			.match(new RegExp(anyResistRegex, 'gi'))
			?.reduce((sum, m) => sum + Number(m.match(anyResistRegex)[1]), 0) || 0;
		let fullDps = Number(itemText.match(fullDpsRegex)?.[1]) || 0;

		let unscaledValue =
			effectiveHitPool * this.valueParams_.life +
			totalResist * this.valueParams_.resist +
			fullDps * this.valueParams_.dps;

		let summaryText = [
			textPrefix ? `@bold,green ${textPrefix}` : '',
			textPrefix ? '-'.repeat(30) : '',
			...itemText.split('\n').map(itemTextLine => {
				if (itemTextLine && itemTextLine === textPrefix)
					return `@bold,green ${itemTextLine}`;
				if (itemTextLine.match(effectiveHitPoolRegex))
					return `@bold,blue ${itemTextLine}`;
				if (itemTextLine.match(flatLifeRegex))
					return `@bold,blue ${itemTextLine}`;
				if (itemTextLine.match(anyResistRegex))
					return `@bold,orange ${itemTextLine}`;
				if (itemTextLine.match(fullDpsRegex))
					return `@bold,red ${itemTextLine}`;
				return itemTextLine;
			}),
			'-'.repeat(30),
			effectiveHitPool ? `@blue,bold Effective Hit Pool ${effectiveHitPool}%` : '',
			flatLife ? `@blue,bold Flat Life ${flatLife}` : '',
			totalResist ? `@orange,bold Total Resist ${totalResist}` : '',
			fullDps ? `@red,bold Full DPS ${fullDps}%` : '',
			`@green,bold Value ${PobApi.round(unscaledValue, 3)}`,
		].filter(v => v).join('\n');

		return {
			unscaledValue: PobApi.round(unscaledValue, 3),
			value: PobApi.round(unscaledValue * valueScale, 3),
			text: summaryText,
		};
	}

	static clean(outString) {
		return outString
			.replace(/\^x[\dA-F]{6}/g, '')
			.replace(/\^\d/g, '')
			.replace(/\r/g, '')
			.trim();
	}

	static round(number, precision) {
		let m = 10 ** precision;
		return Math.round(number * m) / m;
	}
}

// singleton
module.exports = new PobApi();

// todo annotate clipboard item
// todo make work when multiple 'Equipping this item' [high]

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
			this.reset();
			this.refreshBuild();
			this.emit('change');
		}
		if (err)
			console.error(err);
		if (out) {
			// console.log('pobApi.lua: ', out.slice(0, 100), 'old remaining',
			// 	this.pendingResponses.length);
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
		if (this.cache[text])
			return this.cache[text];
		console.log('PobApi sending:', text, 'new queue:', this.pendingResponses.length + 1);
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
		this.reset();
		this.refreshBuild();
		this.emit('change');
	}

	set build(path) {
		// e.g. '~/.var/app/community.pathofbuilding.PathOfBuilding/data/pobfrontend/Path of
		// Building/Builds/cobra lash.xml'
		this.build_ = path;
		if (path) {
			this.reset();
			this.send(false, 'build', path).then(() => this.emit('ready'));
			this.emit('change');
		}
	}

	refreshBuild() {
		this.build = this.build_;
	}

	reset() {
		this.pendingResponses.forEach(pendingResponse => pendingResponse.reject());
		this.pendingResponses = [];
		this.cache = {};
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

		// not all pseudo mods are mapped; handles the ones with 'total' in their text
		if (itemMod.toLowerCase().endsWith('(pseudo)'))
			itemMod = itemMod
				// '+#% total to * Resistance (pseudo)' -> '+#% to * Resistance (pseudo)'
				.replace(/total (to .* resistance)/i, '$1')
				// '+#% total Resistance (pseudo)' -> '+#% to chaos Resistance (pseudo)'
				.replace(/total resistance/i, 'to chaos resistance')
				// '+#% total Attack Speed (pseudo)' -> '#% increased Attack Speed (pseudo)'
				.replace(/\+#% total (.*) speed/i, '#% increased $1 speed')
				// '+# total to * (pseudo)' -> '+# to * (pseudo)'
				// e.g. strength, max life, phys dmg, spell crit, gem level
				.replace(/total/i, '');

		itemMod = itemMod.replace(/#/g, pluginNumber); // pluginNumber
		return this.send(true, 'mod', itemMod, pobType)
			.then(text => this.parseItemTooltip(text, 1 / pluginNumber, itemMod));
	}

	async generateQuery(type = undefined) {
		let pobType = await PobApi.getPobType(type);
		if (!pobType)
			return Promise.reject();
		return this.send(true, 'generateQuery', pobType, this.valueParams_.life,
			this.valueParams_.resist, this.valueParams_.dps);
	}

	parseItemTooltip(itemText, valueScale = 1, textPrefix = '') {
		itemText = PobApi.clean(itemText);

		let effectiveHitPoolRegex = /effective hit pool \(([+-][\d.]+)%\)/i;
		let flatLifeRegex = /([+-][\d,]+) total life/i;
		let anyItemResistRegex = /[+-]\d+% to .* resistances?/i;
		let anyDiffResistRegex = /([+-]\d+)% (?:fire|lightning|cold|chaos) res(?:\.|istance)/i;
		let fullDpsRegex = /full dps \(([+-][\d.]+)%\)/i;

		if (!itemText.split('Equipping this item').slice(1).forEach)
			console.error(itemText);

		let diffs = itemText.split(/(?=equipping this item)/i).slice(1).map(diffText => {
			let equippingText = diffText.match(/equipping this item.*/i)[0];
			let effectiveHitPool = Number(diffText.match(effectiveHitPoolRegex)?.[1]) || 0;
			let flatLife = Number(diffText.match(flatLifeRegex)?.[1].replace(/,/g, '')) || 0;
			let totalResist = diffText
				.match(new RegExp(anyDiffResistRegex, 'gi'))
				?.reduce((sum, m) => sum + Number(m.match(anyDiffResistRegex)[1]), 0) || 0;
			let fullDps = Number(diffText.match(fullDpsRegex)?.[1]) || 0;
			let unscaledValue =
				effectiveHitPool * this.valueParams_.life +
				totalResist * this.valueParams_.resist +
				fullDps * this.valueParams_.dps;

			return {
				equippingText,
				effectiveHitPool,
				flatLife,
				totalResist,
				fullDps,
				unscaledValue,
			};
		});

		let diff = PobApi.mapMax(diffs, diff => diff.unscaledValue);

		let summaryText = [
			textPrefix ? `@bold,green ${textPrefix}` : '',
			textPrefix ? '-'.repeat(30) : '',
			diffs.length > 1 ? `@bold,green ${diff.equippingText}` : null,
			diff.effectiveHitPool ? `@bold,blue Effective Hit Pool ${diff.effectiveHitPool}%` : '',
			diff.flatLife ? `@bold,blue Flat Life ${diff.flatLife}` : '',
			diff.totalResist ? `@bold,orange Total Resist ${diff.totalResist}` : '',
			diff.fullDps ? `@bold,red Full DPS ${diff.fullDps}%` : '',
			`@bold,green Value ${PobApi.round(diff.unscaledValue, 3)}`,
			'-'.repeat(30),
			...itemText.split('\n').map(itemTextLine => {
				if (textPrefix && itemTextLine === textPrefix)
					return `@bold,green ${itemTextLine}`;
				if (itemTextLine.match(effectiveHitPoolRegex))
					return `@bold,blue ${itemTextLine}`;
				if (itemTextLine.match(flatLifeRegex))
					return `@bold,blue ${itemTextLine}`;
				if (itemTextLine.match(anyItemResistRegex))
					return `@bold,orange ${itemTextLine}`;
				if (itemTextLine.match(anyDiffResistRegex))
					return `@bold,orange ${itemTextLine}`;
				if (itemTextLine.match(fullDpsRegex))
					return `@bold,red ${itemTextLine}`;
				if (itemTextLine.match(/^equipping this item/i))
					return `@bold,green ${itemTextLine}`;
				if (itemTextLine.match(/^tip: /i))
					return null;
				return itemTextLine;
			}),
		].filter(v => v).join('\n');

		return {
			value: PobApi.round(diff.unscaledValue * valueScale, 3),
			text: summaryText,
		};
	}

	static async getPobType(type = undefined) {
		return ApiConstants.POB_TYPES[await ApiConstants.constants.typeTextToId(type)];
	}

	static clean(outString) {
		return outString
			.replace(/\^x[\dA-F]{6}/g, '')
			.replace(/\^\d/g, '')
			.replace(/\r/g, '')
			.trim();
	}

	static mapMax(array, handler) {
		let maxI = 0;
		let max = -Infinity;
		array.forEach((value, i) => {
			let map = handler(value);
			if (map > max) {
				maxI = i;
				max = map;
			}
		});
		return array[maxI];
	}

	static round(number, precision) {
		let m = 10 ** precision;
		return Math.round(number * m) / m;
	}
}

// singleton
module.exports = new PobApi();

// todo annotate clipboard item

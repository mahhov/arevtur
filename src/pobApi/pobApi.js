const path = require('path');
const os = require('os');
const {spawn} = require('child_process');
const {CustomOsScript, XPromise} = require('js-desktop-base');
const ApiConstants = require('../arevtur/ApiConstants');
const Emitter = require('../util/Emitter');

class Script extends CustomOsScript {
	constructor(pobPath) {
		super(pobPath);
		this.pendingResponses = [];
		this.cache = {};
		this.addListener(response => this.onScriptResponse(response));
		this.cleared = false;
	}

	spawnProcess(pobPath) {
		let luajit = os.platform() === 'linux' ? 'luajit' : 'luajit.exe';
		return spawn(
			path.resolve(path.join(__dirname, luajit)),
			[path.join(__dirname, './pobApi.lua')],
			{cwd: pobPath});
	}

	onScriptResponse({out, err, exit}) {
		if (exit || err) {
			console.error('PobApi failed:', err, exit);
			this.clear();
			return;
		}
		// console.log('PobApi response:', out);
		if (out && !this.cleared)
			out.split('.>')
				.map(split => split.split('<.')[1])
				.filter(v => v !== undefined) // last value after split will be undefined
				.forEach(resolve => this.pendingResponses.shift().resolve(resolve));
	}

	send(...args) {
		if (this.cleared)
			return Promise.reject('PobApi script already cleared');
		let text = args.map(arg => `<${arg}>`).join(' ');
		if (this.cache[text])
			return this.cache[text];
		let promise = new XPromise();
		this.cache[text] = promise;
		this.pendingResponses.push(promise);
		// console.log('PoBApi sending', text);
		super.send(text);
		return promise;
	}

	clear() {
		this.cleared = true;
		this.pendingResponses.forEach(pendingResponse =>
			pendingResponse.reject('PoBApi failed'));
		this.pendingResponses = [];
	}
}

class PobApi extends Emitter {
	constructor() {
		super();
		this.pobPath = '';
		this.buildPath = '';
		this.weights = {
			life: 0,
			resist: 0,
			damage: 0,
			str: 0,
			dex: 0,
			int: 0,
		};
		this.script = null;
		// this.crashCount = 0;
	}

	setParams({
		          pobPath = this.pobPath,
		          buildPath = this.buildPath,
		          weights = this.weights,
	          } = {}) {
		if (pobPath !== this.pobPath || buildPath !== this.buildPath) {
			this.pobPath = pobPath;
			this.buildPath = buildPath;
			this.restart();
		}
		this.weights = weights;
	}

	restart() {
		this.script?.clear();
		this.emit('change');
		console.log('PobApi creating new script', this.pobPath, this.buildPath);
		this.script = new Script(this.pobPath);
		this.send('build', this.buildPath);
	}

	async send(...args) {
		if (!this.script)
			return Promise.reject('Ignoring PoB requests until script has started');
		this.emit('busy');
		let response = this.script.send(...args);
		response
			.then(() => {
				if (!this.script.pendingResponses.length)
					this.emit('ready');
			})
			.catch(() => this.emit('not-ready'));
		// rejections are expected
		return response.catch(() => '');
	}

	evalItem(item) {
		if (!item.toLowerCase().includes('requirements:') &&
			!item.toLowerCase().includes('sockets:'))
			return Promise.reject('Item missing requirements & sockets');
		return this.send('item', item.replace(/[\n\r]+/g, ' \\n '))
			.then(text => this.parseItemTooltip(text));
	}

	async evalItemModSummary(type = undefined, itemMod = undefined, pluginNumber = 1, raw = false) {
		let pobType = await PobApi.getPobType(type);
		if (!pobType || !itemMod)
			return Promise.reject('PoB evalItemModSummary missing type or mod');

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
		return this.send('mod', itemMod, pobType)
			.then(text => this.parseItemTooltip(text, 1 / pluginNumber, itemMod));
	}

	async getModWeights(type = undefined, includeCorrupted = true) {
		let pobType = await PobApi.getPobType(type);
		if (!pobType)
			return Promise.reject('PoB getModWeights missing type');
		return this.send('getModWeights', pobType, this.weights.life,
			this.weights.resist, this.weights.damage, this.weights.str, this.weights.dex,
			this.weights.int, includeCorrupted).then(JSON.parse);
	}

	parseItemTooltip(itemText, valueScale = 1, textPrefix = '') {
		itemText = PobApi.clean(itemText);

		let effectiveHitPoolRegex = /effective hit pool \(([+-][\d.]+)%\)/i;
		let anyItemResistRegex = /[+-]\d+% to .* resistances?/i;
		let anyDiffResistRegex = /([+-]\d+)% (?:fire|lightning|cold|chaos) res(?:\.|istance)/i;
		let fullDpsRegex = /full dps \(([+-][\d.]+)%\)/i;
		let strRegex = /([+-]\d+) strength/i;
		let dexRegex = /([+-]\d+) dexterity/i;
		let intRegex = /([+-]\d+) intelligence/i;

		if (!itemText.split('Equipping this item').slice(1).forEach)
			console.error(itemText);

		let diffs = itemText.split(/(?=equipping this item)/i).slice(1).map(diffText => {
			// todo[medium] see if we can use a loop to reduce repeated logic
			let equippingText = diffText.match(/equipping this item.*/i)[0];
			let effectiveHitPool = Number(diffText.match(effectiveHitPoolRegex)?.[1]) || 0;
			let totalResist = diffText
				.match(new RegExp(anyDiffResistRegex, 'gi'))
				?.reduce((sum, m) => sum + Number(m.match(anyDiffResistRegex)[1]), 0) || 0;
			let fullDps = Number(diffText.match(fullDpsRegex)?.[1]) || 0;
			let str = Number(diffText.match(strRegex)?.[1]) || 0;
			let dex = Number(diffText.match(dexRegex)?.[1]) || 0;
			let int = Number(diffText.match(intRegex)?.[1]) || 0;
			let unscaledValue =
				effectiveHitPool * this.weights.life +
				totalResist * this.weights.resist +
				fullDps * this.weights.damage +
				str * this.weights.str +
				dex * this.weights.dex +
				int * this.weights.int;

			return {
				equippingText,
				effectiveHitPool,
				totalResist,
				str,
				dex,
				int,
				fullDps,
				unscaledValue,
			};
		});

		let diff = PobApi.mapMax(diffs, diff => diff.unscaledValue);

		let summaryText = [
			textPrefix ? `@bold,green ${textPrefix}` : '',
			textPrefix ? '-'.repeat(30) : '',
			diffs.length > 1 ? `@bold,green ${diff.equippingText}` : null,
			this.weights.life && diff.effectiveHitPool ?
				`@bold,blue Effective Hit Pool ${diff.effectiveHitPool}%` : '',
			this.weights.resist && diff.totalResist ?
				`@bold,orange Total Resist ${diff.totalResist}` : '',
			this.weights.damage && diff.fullDps ?
				`@bold,red Full DPS ${diff.fullDps}%` : '',
			this.weights.str && diff.str ?
				`@bold,light-green Str ${diff.str}` : '',
			this.weights.dex && diff.dex ?
				`@bold,light-green Dex ${diff.dex}` : '',
			this.weights.int && diff.int ?
				`@bold,light-green Int ${diff.int}` : '',
			`@bold,green Value ${PobApi.round(diff.unscaledValue, 3)}`,
			'-'.repeat(30),
			...itemText.split('\n').map(itemTextLine => {
				if (textPrefix && itemTextLine === textPrefix)
					return `@bold,green ${itemTextLine}`;
				if (itemTextLine.match(effectiveHitPoolRegex))
					return `@bold,blue ${itemTextLine}`;
				if (itemTextLine.match(anyItemResistRegex))
					return `@bold,orange ${itemTextLine}`;
				if (itemTextLine.match(anyDiffResistRegex))
					return `@bold,orange ${itemTextLine}`;
				if (itemTextLine.match(fullDpsRegex))
					return `@bold,red ${itemTextLine}`;
				if (itemTextLine.match(strRegex))
					return `@bold,light-green ${itemTextLine}`;
				if (itemTextLine.match(dexRegex))
					return `@bold,light-green ${itemTextLine}`;
				if (itemTextLine.match(intRegex))
					return `@bold,light-green ${itemTextLine}`;
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

// todo[high] allow configs ignoring ES and excluding resists from effective health
// todo[medium] failing when timeless jewel is equipped:
//   Failed to load /Data/TimelessJewelData/GloriousVanity.bin, or data is out of date, falling
//  back to compressed file Failed to load either file: /Data/TimelessJewelData/GloriousVanity.zip,
//  /Data/TimelessJewelData/GloriousVanity.bin
// todo[blocking] crashing with jewels, cluster jewels, and mega jewel
// todo[blocking] crashing with flasks

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
		this.inProgressResponse = '';
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
		// let maxLength = 200;
		// console.log('PobApi response:', out.length > maxLength ?
		// 	`${out.slice(0, maxLength / 2)}...${out.slice(-maxLength / 2)}` : out);
		if (out && !this.cleared) {
			out
				.split(/(<\.|\.>)/)
				.filter(v => v)
				.forEach(part => {
					if (part === '<.') {
						if (this.inProgressResponse)
							console.log('PobApi debug response:', this.inProgressResponse);
						this.inProgressResponse = '';
					} else if (part === '.>') {
						this.pendingResponses.shift().resolve(this.inProgressResponse);
						this.inProgressResponse = '';
					} else {
						this.inProgressResponse += part;
					}
				});
		}
	}

	send(argsObj) {
		if (this.cleared)
			return Promise.reject('PobApi script already cleared');
		let text = JSON.stringify(argsObj);
		if (this.cache[text])
			return this.cache[text];
		let promise = new XPromise();
		this.cache[text] = promise;
		this.pendingResponses.push(promise);
		// console.log('PoBApi sending', text);
		super.send(text);
		return promise;
	}

	async clear() {
		(await this.process).kill('SIGKILL'); // necessary on linux
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
		this.extraMods = {
			ignoreEs: false,
			equalResists: false,
		};
		this.script = null;
	}

	setParams({
		          pobPath = this.pobPath,
		          buildPath = this.buildPath,
		          weights = this.weights,
		          extraMods = this.extraMods,
	          } = {}) {
		this.pobPath = pobPath;
		this.buildPath = buildPath;
		this.weights = weights;
		this.extraMods = [
			extraMods.ignoreEs ? 'maximum energy shield is 0' : '',
			extraMods.equalResists ? '+1000% to all resistances' : '',
		].filter(v => v).join(' \\n ');
		this.restart();
		// todo[low] support stopping pending commands without having to restart the script
	}

	async restart() {
		await this.script?.clear();
		if (this.pobPath && this.buildPath) {
			this.script = new Script(this.pobPath);
			this.send({
				cmd: 'build',
				path: this.buildPath,
			});
		}
		this.emit('change');
	}

	async send(argsObj) {
		if (!this.script)
			return Promise.reject('Ignoring PoB requests until script has started');
		let response = this.script.send(argsObj);
		this.emit('busy', this.script.pendingResponses.length);
		response
			.then(() => this.emit('busy', this.script.pendingResponses.length))
			.catch(() => this.emit('not-ready'));
		// rejections are expected
		return response.catch(() => '');
	}

	evalItem(item) {
		if (!['requirements:', 'sockets:', 'item class: jewels']
			.some(search => item.toLowerCase().includes(search)))
			return Promise.reject('Item is unequippable');
		return this.send({
			cmd: 'item',
			text: item.replace(/[\n\r]+/g, ' \\n '),
			weights: this.weights,
			extraMods: this.extraMods,
		}).then(text => this.parseItemTooltip(text));
	}

	evalItemWithCraft(item, craftedMods) {
		if (!['requirements:', 'sockets:', 'item class: jewels']
			.some(search => item.toLowerCase().includes(search)))
			return Promise.reject('Item is unequippable');
		item = [item, '// Craft:', ...craftedMods].join('\n');
		return this.send({
			cmd: 'item',
			text: item.replace(/[\n\r]+/g, ' \\n '),
			weights: this.weights,
			extraMods: this.extraMods,
		}).then(text => this.parseItemTooltip(text, 1, craftedMods));
	}

	// todo[low] rename evalItemMod
	async evalItemModSummary(type = undefined, itemMod = undefined, pluginNumber = 1) {
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
		return this.send({
			cmd: 'mod',
			mod: itemMod,
			type: pobType,
			weights: this.weights,
			extraMods: this.extraMods,
		})
			.then(text => this.parseItemTooltip(text, 1 / pluginNumber, [itemMod],
				Number(pobType.match(/\d+/)?.[0]) || 1));
	}

	async getModWeights(type = undefined, includeCorrupted = true) {
		// todo[low] mod weights might be different for ring slot 1 v ring slot 2
		let pobType = await PobApi.getPobType(type);
		if (!pobType)
			return Promise.reject('PoB getModWeights missing type');
		return this.send({
			cmd: 'getModWeights',
			type: pobType,
			includeCorrupted,
			weights: this.weights,
			extraMods: this.extraMods,
		}).then(JSON.parse);
	}

	async getCraftedMods() {
		let jsonString = await this.send({
			cmd: 'getCraftedMods',
		});
		return Object.values(JSON.parse(jsonString));
	}

	parseItemTooltip(itemText, valueScale = 1, textPrefixes = [], exactDiff = 0) {
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

		let diffTexts = itemText.split(/(?=equipping this item)/i).slice(1);
		if (!diffTexts.length)
			diffTexts.push('');

		let diffs = diffTexts.map(diffText => {
			// todo[low] see if we can use a loop to reduce repeated logic
			let equippingText = diffText.match(/equipping this item.*/i)?.[0] || '';
			let equippingIndex = Number(equippingText.match(/\d+/)?.[0]) || 1;
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
				equippingIndex,
				effectiveHitPool,
				totalResist,
				str,
				dex,
				int,
				fullDps,
				unscaledValue,
			};
		});

		let diff = exactDiff ?
			diffs.find(diff => diff.equippingIndex === exactDiff) :
			PobApi.mapMax(diffs, diff => diff.unscaledValue);

		let summaryText = [
			...textPrefixes.map(textPrefix => `@bold,pink ${textPrefix}`),
			textPrefixes.length ? '-'.repeat(30) : '',
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
				if (textPrefixes.some(textPrefix => itemTextLine === textPrefix))
					return `@bold,pink ${itemTextLine}`;
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
				if (itemTextLine.match(/^\/\/ Craft:$/i))
					return `@bold,pink ${itemTextLine}`;
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

module.exports = new PobApi();

// todo[medium] failing when timeless jewel is equipped:
//   Failed to load /Data/TimelessJewelData/GloriousVanity.bin, or data is out of date, falling
//  back to compressed file Failed to load either file: /Data/TimelessJewelData/GloriousVanity.zip,
//  /Data/TimelessJewelData/GloriousVanity.bin
// todo[high] tooltip not working for cluster jewels, mega jewels, flasks
// todo[high] way to cancel queue when e.g. running new search or changing item type or changing
//  weights

const path = require('path');
const os = require('os');
const {spawn} = require('child_process');
const {CustomOsScript, XPromise} = require('js-desktop-base');
const Emitter = require('../../util/Emitter');
const {round, deepEquality} = require('../../util/util');

class Script extends CustomOsScript {
	constructor(pobPath) {
		super(pobPath);
		this.pendingResponses = [];
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
		if (this.cleared) return;
		if (err || exit) {
			console.error('PobApi, lua failed:', err, exit);
			this.clear();
		} else if (out)
			out
				.split(/(<\.|\.>)/)
				.filter(v => v)
				.forEach(part => {
					if (part === '<.') {
						if (this.inProgressResponse)
							console.log('PobApi, debug response:', this.inProgressResponse);
						this.inProgressResponse = '';
					} else if (part === '.>') {
						this.pendingResponses.shift().resolve(this.inProgressResponse);
						this.inProgressResponse = '';
					} else {
						this.inProgressResponse += part;
					}
				});
	}

	send(text) {
		if (this.cleared)
			return Promise.reject('script already cleared');
		let promise = new XPromise();
		this.pendingResponses.push(promise);
		super.send(text);
		return promise;
	}

	async clear() {
		this.cleared = true;
		(await this.process).kill('SIGKILL'); // necessary on linux
		this.pendingResponses.forEach(promise => promise.reject('clearing script'));
		this.pendingResponses = [];
	}
}

class PobApi extends Emitter {
	constructor() {
		super();
		this.pobPath = '';
		this.buildPath = '';
		this.weights = {};
		this.options = {};
		this.extraMods = {};
		this.cache = {};
		this.script = null;
	}

	setParams({
		          pobPath = this.pobPath,
		          buildPath = this.buildPath,
		          weights = this.weights,
		          options = this.options,
		          extraMods = this.extraMods,
	          } = {}) {
		if (pobPath === this.pobPath && buildPath === this.buildPath &&
			deepEquality(weights, this.weights) &&
			deepEquality(options, this.options) &&
			deepEquality(extraMods, this.extraMods))
			return;

		let clearCache = pobPath !== this.pobPath || buildPath !== this.buildPath;

		this.pobPath = pobPath;
		this.buildPath = buildPath;
		this.weights = weights;
		this.options = options;
		this.extraMods = extraMods;

		// restart to cancel pending requests
		if (clearCache || !this.script || this.script.pendingResponses.length ||
			this.script.cleared)
			this.restart(clearCache);
		else
			this.emit('change');
	}

	async restart(clearCache = true) {
		if (clearCache)
			this.cache = {};
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
			return Promise.reject('script has not started');
		let argsString = JSON.stringify(argsObj);
		if (this.cache[argsString] && !this.cache[argsString].error && argsObj.cmd !== 'build')
			return this.cache[argsString];
		this.cache[argsString] = this.script.send(argsString);
		this.emit('busy', this.script.pendingResponses.length);
		this.cache[argsString]
			.then(() => this.emit('busy', this.script.pendingResponses.length))
			.catch(e => {
				console.warn('PobApi, send failed:', e);
				if (this.script.cleared)
					this.emit('not-ready');
			});
		// rejections are expected
		return this.cache[argsString].catch(() => null);
	}

	evalItem(item) {
		if (!PobApi.isItemEquippable(item))
			return Promise.reject('item is unequippable');
		return this.send({
			cmd: 'item',
			text: item.replace(/[\n\r]+/g, ' \\n '),
			weights: this.weights,
			extraMods: this.extraModStrings,
		}).then(text => this.parseItemTooltip(text));
	}

	evalItemWithCraft(item, craftedMods) {
		if (!PobApi.isItemEquippable(item))
			return Promise.reject('item is unequippable');
		item = [
			...item.split('\n').filter(line => !line.includes('(crafted)')),
			'',
			...craftedMods,
		].join('\n');
		return this.send({
			cmd: 'item',
			text: item.replace(/[\n\r]+/g, ' \\n '),
			weights: this.weights,
			extraMods: this.extraModStrings,
		}).then(text => this.parseItemTooltip(text, 1, craftedMods));
	}

	// todo[low] rename evalItemMod
	async evalItemModSummary(pobType = undefined, itemMod = undefined, pluginNumber = 1) {
		if (!pobType || !itemMod)
			return Promise.reject('item missing type or mod');

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
			extraMods: this.extraModStrings,
		})
			.then(text => this.parseItemTooltip(text, 1 / pluginNumber, [itemMod],
				Number(pobType.match(/\d+/)?.[0]) || 1));
	}

	async getModWeights(pobType = undefined, includeCorrupted = true) {
		// todo[low] mod weights might be different for ring slot 1 v ring slot 2
		if (!pobType)
			return Promise.reject('missing type');
		return this.send({
			cmd: 'getModWeights',
			type: pobType,
			includeCorrupted,
			weights: this.weights,
			options: this.options,
			extraMods: this.extraModStrings,
		})
			.then(JSON.parse)
			.then(([minValue, modWeights]) => ({minValue, modWeights}));
	}

	async getCraftedMods() {
		let jsonString = await this.send({
			cmd: 'getCraftedMods',
		});
		return Object.values(JSON.parse(jsonString));
	}

	get extraModStrings() {
		return [
			this.extraMods.ignoreEs ? 'maximum energy shield is 0' : '',
			this.extraMods.equalElementalResists ? '+1000% to all elemental resistances' : '',
			this.extraMods.equalChaosResist ? '+1000% to chaos resistance' : '',
		].filter(v => v).join(' \\n ');
	}

	parseItemTooltip(itemText, valueScale = 1, textPrefixes = [], exactDiff = 0) {
		itemText = PobApi.clean(itemText);

		let effectiveHitPoolRegex = /effective hit pool \(([+-][\d.]+)%\)/i;
		let anyItemResistRegex = /[+-]\d+% to .* resistances?/i;
		let elementalResistRegex = /([+-]\d+)% (?:fire|lightning|cold) res(?:\.|istance)/i;
		let chaosResistRegex = /([+-]\d+)% chaos res(?:\.|istance)/i;
		let fullDpsRegex = /full dps \(([+-][\d.]+)%\)/i;
		let strRegex = /([+-]\d+) strength/i;
		let dexRegex = /([+-]\d+) dexterity/i;
		let intRegex = /([+-]\d+) intelligence/i;

		let diffTexts = itemText.split(/(?=equipping this item)/i).slice(1);
		if (!diffTexts.length)
			diffTexts.push('');

		let diffs = diffTexts.map(diffText => {
			// todo[low] see if we can use a loop to reduce repeated logic
			let equippingText = diffText.match(/equipping this item.*/i)?.[0] || '';
			let equippingIndex = Number(equippingText.match(/\d+/)?.[0]) || 1;
			let effectiveHitPool = Number(diffText.match(effectiveHitPoolRegex)?.[1]) || 0;
			let elementalResist = diffText
				.match(new RegExp(elementalResistRegex, 'gi'))
				?.reduce((sum, m) => sum + Number(m.match(elementalResistRegex)[1]), 0) || 0;
			let chaosResist = Number(diffText.match(chaosResistRegex)?.[1]) || 0;
			let fullDps = Number(diffText.match(fullDpsRegex)?.[1]) || 0;
			let str = Number(diffText.match(strRegex)?.[1]) || 0;
			let dex = Number(diffText.match(dexRegex)?.[1]) || 0;
			let int = Number(diffText.match(intRegex)?.[1]) || 0;
			let unscaledValue =
				effectiveHitPool * this.weights.life +
				elementalResist * this.weights.elementalResist +
				chaosResist * this.weights.chaosResist +
				fullDps * this.weights.damage +
				str * this.weights.str +
				dex * this.weights.dex +
				int * this.weights.int;

			return {
				equippingText,
				equippingIndex,
				effectiveHitPool,
				elementalResist,
				chaosResist,
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
			this.weights.elementalResist && diff.elementalResist ?
				`@bold,orange Elemental Resist ${diff.elementalResist}` : '',
			this.weights.chaosResist && diff.chaosResist ?
				`@bold,orange Chaos Resist ${diff.chaosResist}` : '',
			this.weights.damage && diff.fullDps ?
				`@bold,red Full DPS ${diff.fullDps}%` : '',
			this.weights.str && diff.str ?
				`@bold,light-green Str ${diff.str}` : '',
			this.weights.dex && diff.dex ?
				`@bold,light-green Dex ${diff.dex}` : '',
			this.weights.int && diff.int ?
				`@bold,light-green Int ${diff.int}` : '',
			`@bold,green Value ${round(diff.unscaledValue, 3)}`,
			'-'.repeat(30),
			...itemText.split('\n').map(itemTextLine => {
				if (textPrefixes.some(textPrefix => itemTextLine === textPrefix))
					return `@bold,pink ${itemTextLine}`;
				if (itemTextLine.match(effectiveHitPoolRegex))
					return `@bold,blue ${itemTextLine}`;
				if (itemTextLine.match(anyItemResistRegex))
					return `@bold,orange ${itemTextLine}`;
				if (itemTextLine.match(elementalResistRegex))
					return `@bold,orange ${itemTextLine}`;
				if (itemTextLine.match(chaosResistRegex))
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
			value: round(diff.unscaledValue * valueScale, 3),
			text: summaryText,
		};
	}

	static isItemEquippable(item) {
		return true;
		// return ['requirements:', 'sockets:', 'item class: jewels', 'rarity: unique'].some(search =>
		// 	item.toLowerCase().includes(search));
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
}

module.exports = new PobApi();

// todo[medium] failing when timeless jewel is equipped:
//   Failed to load /Data/TimelessJewelData/GloriousVanity.bin, or data is out of date, falling
//  back to compressed file Failed to load either file: /Data/TimelessJewelData/GloriousVanity.zip,
//  /Data/TimelessJewelData/GloriousVanity.bin
// todo[high] tooltip not working for cluster jewels, mega jewels, flasks

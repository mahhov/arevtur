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
						// if (this.inProgressResponse)
						// 	console.log('PobApi, debug response:', this.inProgressResponse);
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
		this.weights2 = [];
		this.options = {};
		this.extraMods = {};
		this.cache = {};
		this.script = null;
	}

	setParams({
		          pobPath = this.pobPath,
		          buildPath = this.buildPath,
		          weights2 = this.weights2,
		          options = this.options,
		          extraMods = this.extraMods,
	          } = {}) {
		if (pobPath === this.pobPath && buildPath === this.buildPath &&
			deepEquality(weights2, this.weights2) &&
			deepEquality(options, this.options) &&
			deepEquality(extraMods, this.extraMods))
			return;

		let clearCache = pobPath !== this.pobPath || buildPath !== this.buildPath;

		this.pobPath = pobPath;
		this.buildPath = buildPath;
		this.weights2 = weights2;
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

	send(argsObj) {
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

	queryBuildStats() {
		return this.send({
			cmd: 'queryBuildStats',
			extraMods: this.extraModStrings,
		}).then(JSON.parse);
	}

	evalItem(item) {
		if (!PobApi.isItemEquippable(item))
			return Promise.reject('item is unequippable');
		return this.send({
			cmd: 'item',
			text: item.replace(/[\n\r]+/g, ' \\n '),
			extraMods: this.extraModStrings,
		})
			.then(JSON.parse)
			.then(obj => this.parseItemTooltip(obj));
	}

	evalItemWithCraft(item, craftedMods) {
		item = [
			...item.split('\n').filter(line => !line.includes('(crafted)')),
			'',
			...craftedMods,
		].join('\n');
		return this.evalItem(item);
	}

	// todo[low] rename evalItemMod
	evalItemModSummary(pobType = undefined, itemMod = undefined, pluginNumber = 1) {
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
		if (!itemMod.includes(' increased '))
			itemMod = itemMod.replace(/^#/, '+#');
		itemMod = itemMod.replace(/#/g, pluginNumber); // pluginNumber

		return this.send({
			cmd: 'mod',
			mod: itemMod,
			type: pobType,
			extraMods: this.extraModStrings,
		})
			.then(JSON.parse)
			.then(obj => this.parseItemTooltip(obj))
			.then(parsed => ({
				value: parsed.value / pluginNumber,
				...parsed,
			}));
	}

	getModWeights(pobType = undefined, includeCorrupted = true) {
		// todo[low] mod weights might be different for ring slot 1 v ring slot 2
		if (!pobType)
			return Promise.reject('missing type');
		return this.send({
			cmd: 'getModWeights',
			type: pobType,
			includeCorrupted,
			weights: this.weights2,
			options: this.options,
			extraMods: this.extraModStrings,
		})
			.then(JSON.parse)
			.then(([minValue, modWeights]) => ({
				minValue: minValue / 10,
				modWeights: modWeights.map(modWeight => ({
					...modWeight,
					weight: modWeight.weight / 10,
					meanStatDiff: modWeight.meanStatDiff / 10,
				})),
			}));
	}

	async getCraftedMods() {
		let json = await this.send({cmd: 'getCraftedMods'}).then(JSON.parse);
		return Object.values(json);
	}

	get extraModStrings() {
		return [
			this.extraMods.ignoreEs ? 'maximum energy shield is 0' : '',
			this.extraMods.equalElementalResists ? '+10000% to all elemental resistances' : '',
			this.extraMods.equalChaosResist ? '+10000% to chaos resistance' : '',
		].filter(v => v).join(' \\n ');
	}

	async parseItemTooltip(obj) {
		let valueTextTuples = obj.comparisons
			.map(slotComparison => {
				let value = this.weights2
					.filter(weight => weight.name)
					.reduce((sum, weight) => {
						let oldStat = obj.baseStats[weight.name];
						let newStat = slotComparison.stats[weight.name];
						let value = 0;
						if (weight.flatWeightType)
							value = weight.flatWeight * (newStat - oldStat);
						else if (newStat !== oldStat && oldStat)
							value = weight.percentWeight * (newStat - oldStat) / oldStat * 100;
						return sum + value;
					}, 0);
				let text = [
					`Equipping in @bold,pink ${slotComparison.slotLabel}`,
					slotComparison.replacedItemName ? `Replacing @bold,pink ${slotComparison.replacedItemName}` : '',
					`Grants @bold,pink ${round(value, 3)} @ value`,
					PobApi.colorTooltip(PobApi.cleanTooltip(slotComparison.tooltip)),
				].filter(v => v).join('\n');
				return {value, text};
			})
			.sort((a, b) => b.value - a.value);

		let value = round(valueTextTuples[0].value, 3);
		let title = `${obj.name} @bold,pink ${value}`;

		return {
			value,
			text: [
				title,
				...valueTextTuples.map(valueTextTuple => valueTextTuple.text),
			].join(`\n${'-'.repeat(30)}\n`),
		};
	}

	static isItemEquippable(item) {
		return true;
		// return ['requirements:', 'sockets:', 'item class: jewels', 'rarity: unique'].some(search =>
		// 	item.toLowerCase().includes(search));
	}

	static cleanTooltip(string) {
		return string
			.replace(/\^x[\dA-F]{6}/g, '')
			.replace(/\^\d/g, '')
			.replace(/\r/g, '')
			.trim();
	}

	static colorTooltip(string, textPrefixes = []) {
		let effectiveHitPoolRegex = /effective hit pool \(([+-][\d.]+)%\)/i;
		let totalLifeRegex = /total life \(([+-][\d.]+)%\)/i;
		let totalManaRegex = /total mana \(([+-][\d.]+)%\)/i;
		let manaRegenRegex = /([+-][\d.,]+) mana regen/i;
		let anyItemResistRegex = /[+-]\d+% to .* resistances?/i;
		let elementalResistRegex = /([+-]\d+)% (?:fire|lightning|cold) res(?:\.|istance)/i;
		let chaosResistRegex = /([+-]\d+)% chaos res(?:\.|istance)/i;
		let fullDpsRegex = /full dps \(([+-][\d.]+)%\)/i;
		let strRegex = /([+-]\d+) strength/i;
		let dexRegex = /([+-]\d+) dexterity/i;
		let intRegex = /([+-]\d+) intelligence/i;

		return string
			.split('\n')
			.map(tooltipLine => {
				if (textPrefixes.some(textPrefix => tooltipLine === textPrefix))
					return `@bold,pink ${tooltipLine}`;
				if (tooltipLine.match(effectiveHitPoolRegex))
					return `@bold,blue ${tooltipLine}`;
				if (tooltipLine.match(totalLifeRegex))
					return `@bold,blue ${tooltipLine}`;
				if (tooltipLine.match(totalManaRegex))
					return `@bold,blue ${tooltipLine}`;
				if (tooltipLine.match(manaRegenRegex))
					return `@bold,blue ${tooltipLine}`;
				if (tooltipLine.match(anyItemResistRegex))
					return `@bold,orange ${tooltipLine}`;
				if (tooltipLine.match(elementalResistRegex))
					return `@bold,orange ${tooltipLine}`;
				if (tooltipLine.match(chaosResistRegex))
					return `@bold,orange ${tooltipLine}`;
				if (tooltipLine.match(fullDpsRegex))
					return `@bold,red ${tooltipLine}`;
				if (tooltipLine.match(strRegex))
					return `@bold,light-green ${tooltipLine}`;
				if (tooltipLine.match(dexRegex))
					return `@bold,light-green ${tooltipLine}`;
				if (tooltipLine.match(intRegex))
					return `@bold,light-green ${tooltipLine}`;
				if (tooltipLine.match(/^equipping this item/i))
					return `@bold,green ${tooltipLine}`;
				if (tooltipLine.match(/^\/\/ Craft:$/i))
					return `@bold,pink ${tooltipLine}`;
				return tooltipLine;
			})
			.join('\n');
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

// todo[high]
//   allow custom extra mods in new weights UI
//   allow testing mods in new weights UI
//   migrate old pob calls to new calls
//   name text field hard to type
//   why resists not importing

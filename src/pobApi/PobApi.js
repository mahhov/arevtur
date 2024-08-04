const path = require('path');
const {spawn} = require('child_process');
const {CustomOsScript, XPromise} = require('js-desktop-base');
const ApiConstants = require('../arevtur/ApiConstants');

class PobApi extends CustomOsScript {
	constructor(pobPath) {
		super(pobPath);
		this.valueParams = {
			life: 0,
			resist: 0,
			dps: 0,
		};
		this.pendingResponses = [];
		this.readyPromise = this.awaitResponse;
		this.addListener(({out, err, exit}) => {
			if (exit) {
				// todo turn pob status red on crash and only restart if user clicks pob red icon
				console.error('PobApi process exited, starting new process');
				this.pendingResponses.forEach(pendingResponse => pendingResponse.reject());
				this.pendingResponses = [];
				this.restartProcess();
				this.readyPromise = this.awaitResponse;
				if (this.build_)
					this.build = this.build_;
			}
			if (err)
				console.error(err);
			if (out) {
				console.log(out);
				out.split('.>')
					.map(split => split.split('<.')[1])
					.filter((_, i, a) => i !== a.length -
						1) // filter trailing element; e.g. 'a,b,'.split(',') === ['a', 'b', '']
					.forEach(split => this.pendingResponses.shift().resolve(split));
			}
		});
	}

	spawnProcess(pobPath) {
		// e.g.
		// /var/lib/flatpak/app/community.pathofbuilding.PathOfBuilding/current/active/files/pathofbuilding/src
		return spawn(
			'luajit',
			[path.join(__dirname, './pobApi.lua')],
			{cwd: pobPath});
	}

	send(...args) {
		let text = args.map(arg => `<${arg}>`).join(' ');
		console.log('PobApi sending:', text);
		return super.send(text);
	}

	get awaitResponse() {
		this.pendingResponses.push(new XPromise);
		return this.pendingResponses[this.pendingResponses.length - 1];
	}

	get ready() {
		return this.readyPromise;
	}

	set build(path) {
		// e.g. '~/.var/app/community.pathofbuilding.PathOfBuilding/data/pobfrontend/Path of
		// Building/Builds/cobra lash.xml'
		this.build_ = path;
		this.send('build', path);
	}

	set valueParams(valueParams) {
		this.valueParams_ = valueParams;
	}

	evalItem(item) {
		this.send('item', item.replace(/[\n\r]+/g, ' \\n '));
		return this.awaitResponse.then(text => this.parseItemTooltip(text));
	}

	async evalItemModSummary(type = undefined, itemMod = undefined, pluginNumber = 1, raw = false) {
		// todo allow sorting items by pob value
		// todo don't rerun pob for weight changes
		// todo send mods' middle values to pob eval
		let pobType = await PobApi.getPobType(type);
		if (!pobType || !itemMod)
			return {value: 0, text: ''};
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
		this.send('mod', cleanItemMod, pobType);
		return this.awaitResponse.then(
			text => this.parseItemTooltip(text, 1 / pluginNumber, cleanItemMod));
	}

	async generateQuery(type = undefined, maxPrice = 10) {
		let pobType = await PobApi.getPobType(type);
		if (!pobType)
			return;
		// todo figure out how to get resist stats in PoB
		this.send('generateQuery', pobType, maxPrice, this.valueParams_.life,
			this.valueParams_.resist, this.valueParams_.dps);
		return this.awaitResponse;
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

module.exports = PobApi;

// todo annotate clipboard item

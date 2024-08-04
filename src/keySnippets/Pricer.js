const stream = require('bs-better-stream');
const DataFetcher = require('../services/DataFetcher');
const {config} = require('../services/config');

const round = (number, decimals = 2) => {
	let factor = Math.pow(10, decimals);
	return Math.round(number * factor) / factor;
};

const price = (number, unit = 'c') => `${round(number)}${unit}`;

class TextItem {
	constructor(text) {
		// {
		// 	 text: string,
		//	 lines: [], like lastLine,
		//   lastLine: {line: string, words: string[], line split on space},
		//   type: string, first line without first word
		//   name: string, 2nd line,
		//   shaper: boolean,
		//   elder: boolean,
		// }

		if (!text)
			return {error: 'blank input'};

		this.text = text;
		this.lines = text.split(/\r?\n/).filter(a => a).map(line => ({
			line,
			words: line.split(' '),
		}));
		this.lastLine = this.lines[this.lines.length - 1];

		if (this.lines.length < 2)
			return {error: 'short input'};

		this.type = this.lines[1].words.slice(1).join(' ');
		this.name = this.lines[2].line;

		this.shaper = this.lastLine.line === 'Shaper Item';
		this.elder = this.lastLine.line === 'Elder Item';
	}
}

class Pricer {
	constructor(type, dataEndpointsByLeague) {
		this.type = type;
		this.dataEndpointsByLeague = dataEndpointsByLeague;
	}

	refreshData() {
		this.dataStream = stream()
			.write(...this.dataEndpointsByLeague)
			.map(endpointByLeague => endpointByLeague(config.config.league))
			.map(DataFetcher.getData);
	}

	price(inputItem) {
		if (!this.typeFilter(inputItem))
			return Promise.resolve([]);

		console.log('Trying pricer', this.type,
			this.dataEndpointsByLeague[0](config.config.league));

		this.refreshData();

		return this.dataStream.promise.then(() =>
			this.dataStream
				.wait()
				.pluck('lines')
				.flatten()
				.filter(item => this.nameFilter(item, inputItem))
				.map(this.priceString)
				.outValues);
	}

	typeFilter(inputItem) {
		return inputItem.type === this.type;
	}

	nameFilter(item, inputItem) {
		return item.name === inputItem.name;
	}

	priceString(item) {
		return price(item.chaosValue);
	}
}

class UniquePricer extends Pricer {
	constructor() {
		super('Unique', [
			DataFetcher.endpointsByLeague.UNIQUE_JEWEL,
			DataFetcher.endpointsByLeague.UNIQUE_FLASK,
			DataFetcher.endpointsByLeague.UNIQUE_WEAPON,
			DataFetcher.endpointsByLeague.UNIQUE_ARMOUR,
			DataFetcher.endpointsByLeague.UNIQUE_ACCESSORY,
			DataFetcher.endpointsByLeague.UNIQUE_MAP,
		]);
	}

	priceString(item) {
		return `${price(item.chaosValue)} - ${item.links} links`;
	}
}

class CurrencyPricer extends Pricer {
	constructor() {
		super('Currency', [DataFetcher.endpointsByLeague.CURRENCY]);
	}

	typeFilter(inputItem) {
		return super.typeFilter(inputItem)
			&& !EssencePricer.essenceTypeFilter(inputItem)
			&& !FossilPricer.fossilTypeFilter(inputItem)
			&& !ResonatorPricer.resonatorTypeFilter(inputItem);
	}

	nameFilter(item, inputItem) {
		return item.currencyTypeName === inputItem.name;
	}

	priceString(item) {
		let value = item.chaosEquivalent;
		let inverseValue = 1 / value;
		let low = 1 / item.pay?.value;
		let high = item.receive?.value;
		console.log(value, inverseValue, low, high);
		return `${price(value)} ${price(inverseValue, '/c')} [${price(low)} - ${price(high)}]`;
	}
}

class DivinationPricer extends Pricer {
	constructor() {
		super('Divination Card', [DataFetcher.endpointsByLeague.DIVINATION_CARD]);
	}
}

class EssencePricer extends Pricer {
	constructor() {
		super('Currency', [DataFetcher.endpointsByLeague.ESSENCE]);
	}

	static essenceTypeFilter(inputItem) {
		return / Essence of /.test(inputItem.name);
	}

	typeFilter(inputItem) {
		return super.typeFilter(inputItem) && EssencePricer.essenceTypeFilter(inputItem);
	}
}

class GemPricer extends Pricer {
	constructor() {
		super('Gem', [DataFetcher.endpointsByLeague.GEM]);
	}

	priceString(item) {
		let corruptedString = item.corrupted ? 'c' : '';
		return `${price(
			item.chaosValue)} - ${item.gemLevel}/${item.gemQuality}q ${corruptedString}`;
	}
}

class FossilPricer extends Pricer {
	constructor() {
		super('Currency', [DataFetcher.endpointsByLeague.FOSSIL]);
	}

	static fossilTypeFilter(inputItem) {
		return / Fossil$/.test(inputItem.name);
	}

	typeFilter(inputItem) {
		return super.typeFilter(inputItem) && FossilPricer.fossilTypeFilter(inputItem);
	}
}

class FragmentPricer extends Pricer {
	constructor() {
		super('', [DataFetcher.endpointsByLeague.FRAGMENT]);
	}

	typeFilter(inputItem) {
		// sacrifice fragments are type 'Normal'
		// timeless splinters are type 'Currency'
		return true;
	}

	nameFilter(item, inputItem) {
		return item.currencyTypeName === inputItem.name;
	}

	priceString(item) {
		let value = item.chaosEquivalent;
		let low = 1 / item.pay.value;
		let high = item.receive.value;
		return `${price(value)} [${price(low)} - ${price(high)}]`;
	}
}

class ResonatorPricer extends Pricer {
	constructor() {
		super('Currency', [DataFetcher.endpointsByLeague.RESONATOR]);
	}

	static resonatorTypeFilter(inputItem) {
		return / Resonator$/.test(inputItem.name);
	}

	typeFilter(inputItem) {
		return super.typeFilter(inputItem) && ResonatorPricer.resonatorTypeFilter(inputItem);
	}
}

class MapPricer extends Pricer {
	constructor() {
		super('Normal', [DataFetcher.endpointsByLeague.MAP]);
	}

	static mapTypeFilter(inputItem) {
		return /^Map Tier:/.test(inputItem.lines[4].line);
	}

	typeFilter(inputItem) {
		return MapPricer.mapTypeFilter(inputItem);
	}

	nameFilter(item, inputItem) {
		return inputItem.name.includes(item.name);
	}

	priceString(item) {
		return `${price(item.chaosValue)} - ${item.name}, tier ${item.mapTier}`;
	}
}

class ScarabPricer extends Pricer {
	constructor() {
		super('Normal', [DataFetcher.endpointsByLeague.SCARAB]);
	}
}

class BaseItemPricer extends Pricer {
	constructor() {
		super('', [DataFetcher.endpointsByLeague.BASE_ITEM]);
	}

	static isSameVariant(item, inputItem) {
		if (inputItem.shaper)
			return item.variant === 'Shaper';
		if (inputItem.elder)
			return item.variant === 'Elder';
		return !item.variant;
	}

	typeFilter(inputItem) {
		return inputItem.type !== 'Unique';
	}

	nameFilter(item, inputItem) {
		if (item.name !== inputItem.lines[2].line && item.name !== inputItem.lines[3].line)
			return false;
		return BaseItemPricer.isSameVariant(item, inputItem);
	}

	priceString(item) {
		// 50c - Shaper 83
		return `${price(item.chaosValue)} - ${item.variant || ''} ${item.levelRequired}`;
	}
}

class IncubatorPricer extends Pricer {
	constructor() {
		super('Normal', [DataFetcher.endpointsByLeague.INCUBATOR]);
	}
}

class OilPricer extends Pricer {
	constructor() {
		super('Currency', [DataFetcher.endpointsByLeague.OIL]);
	}
}

class BeastPricer extends Pricer {
	constructor() {
		super('Unique', [DataFetcher.endpointsByLeague.BEAST]);
	}
}

class DeliriumOrbPricer extends Pricer {
	constructor() {
		super('Currency', [DataFetcher.endpointsByLeague.DELIRIUM_ORB]);
	}
}

let pricers = stream().write(
	new UniquePricer(),
	new CurrencyPricer(),
	new DivinationPricer(),
	new EssencePricer(),
	new GemPricer(),
	new FossilPricer(),
	new FragmentPricer(),
	new ResonatorPricer(),
	new MapPricer(),
	new ScarabPricer(),
	new BaseItemPricer(),
	new IncubatorPricer(),
	new OilPricer(),
	new BeastPricer(),
	new DeliriumOrbPricer(),
);

let getPrice = async (text) => {
	let textItem = new TextItem(text);
	if (textItem.error)
		return [textItem.error];
	let prices2d = await pricers.map(pricer => pricer.price(textItem)).promise;
	let priceText = stream()
		.write([textItem.name])
		.write(...prices2d)
		.flatten()
		.outValues;
	return priceText.length === 1
		? [`no prices found for ${textItem.name}`]
		: priceText;
};

module.exports = {getPrice};

// let input = require('../resources/sampleInput').currency;
// getPrice(input).then(r => console.log(r));

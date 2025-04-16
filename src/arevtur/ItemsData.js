const Emitter = require('../util/Emitter');
const {round} = require('../util/util');

class ItemsData extends Emitter {
	static valueHandlers = [
		{
			name: 'Weight sorting',
			description: [
				'Sort by trade site weight. Additionally considers open affixes, non-blocked crafts, and defenses like armor.',
				'Less accurate in predicting health & DMG affects on build.',
				'Recommended when not using PoB.',
			].join('\n'),
			sortY: item => item.weightedValue,
			showFilter: item => true,
			trigger: null,
		}, {
			name: 'Build sorting',
			description: [
				'Sort by PoB\'s predicted affects on effective health, total DPS, etc.',
				'Qualities non-corrupted/mirrored items to 20%.',
				'Does modify bench-craft, anointment, or runes.',
				'Recommended for early gear.',
			].join('\n'),
			sortY: item => item.buildValuePromise.resolved.value,
			showFilter: item => item.buildValuePromise.resolved,
			trigger: item => item.buildValuePromise,
		}, {
			name: 'Build + craft sorting',
			description: [
				'Sort by PoB\'s predicted affects on effective health, total DPS, etc.',
				'Qualities non-corrupted/mirrored items to 20%.',
				'For version 1, optimizes bench-craft of non-corrupted/mirrored items. Does not anoint items.',
				'For version 2, maxes # of rune sockets of non-corrupted/mirrored items. Replaces runes matching your existing runes. Un-anoints items.',
				'Recommended for end gear.',
			].join('\n'),
			sortY: item => item.craftValuePromise.resolved.value,
			showFilter: item => item.craftValuePromise.resolved,
			trigger: item => item.craftValuePromise,
		},
	];

	constructor() {
		super();
		this.clear();
		this.shownItemsCache = null;
		this.valueHandler_ = ItemsData.valueHandlers[0];
		this.pricePerValue_ = Infinity;
	}

	clear() {
		this.allItems = [];
		this.shownItemsCache = null;
	}

	refresh() {
		let items = this.allItems;
		this.clear();
		this.join(items);
	}

	setValueHandlerByName(name) {
		this.shownItemsCache = null;
		this.valueHandler_ =
			ItemsData.valueHandlers.find(valueHandler => valueHandler.name === name);
	}

	set pricePerValue(pricePerValue) {
		this.shownItemsCache = null;
		this.pricePerValue_ = pricePerValue;
		this.refresh();
	}

	get y() {
		return this.valueHandler_.sortY;
	}

	join(items) {
		let oldLength = this.allItems.length;
		this.allItems = this.allItems
			.concat(items)
			.filter((v, i, a) => {
				let copies = a.filter((vv, i) => vv.id === v.id);
				if (copies[0] !== v)
					return false;
				v.weightedValue = Math.max(...copies.map(vv => vv.weightedValue));
				v.price.price = Math.min(...copies.map(vv => vv.price.price));
				// todo[low] is it ok to take the max of each, or should the values of the max-sum
				//  be taken?
				v.weightedValueDetails = Object.fromEntries(Object.keys(v.weightedValueDetails).map(
					valueKey => [valueKey,
						Math.max(...copies.map(copy => copy.weightedValueDetails[valueKey]))]));
				return true;
			});

		if (this.valueHandler_.trigger)
			this.allItems
				.filter((_, i) => i >= oldLength)
				.forEach(async item => {
					await this.valueHandler_.trigger(item);
					if (this.allItems.includes(item)) {
						this.shownItemsCache = null;
						this.emit('change');
					}
				});
		else
			this.shownItemsCache = null;
	}

	selectItem(item) {
		item.selected = !item.selected;
	}

	hoverItem(item) {
		this.shownItems.forEach(itemI => itemI.hovered = itemI === item);
	}

	itemByRange(value, price, valueRange, priceRange) {
		let minValue = value - valueRange / 2;
		let maxValue = value + valueRange / 2;
		let minPrice = price - priceRange / 2;
		let maxPrice = price + priceRange / 2;
		return this.shownItems.find(item =>
			this.y(item) > minValue &&
			this.y(item) < maxValue &&
			item.price.price > minPrice &&
			item.price.price < maxPrice);
	}

	get shownItems() {
		return (this.shownItemsCache ||= this.allItems
			.filter(this.valueHandler_.showFilter)
			// high to low values, low to high prices
			.sort((a, b) =>
				this.y(b) - this.y(a) - (b.price.price - a.price.price) / this.pricePerValue_ ||
				this.y(b) - this.y(a)));
	}

	get bestBoundItems() {
		let minPriceFound = Infinity;
		// ordered top right to bottom left
		return [...this.shownItems]
			.sort((a, b) => this.y(b) - this.y(a) || a.price.price - b.price.price)
			.filter(item => {
				if (item.price.price >= minPriceFound)
					return false;
				minPriceFound = item.price.price;
				return true;
			});
	}

	get selectedItems() {
		return this.shownItems.filter(({selected}) => selected);
	}

	get hoveredItems() {
		return this.shownItems.filter(({hovered}) => hovered);
	}

	get bestBoundPath() {
		let maxPrice = Math.max(...this.shownItems.map(item => item.price.price));
		let path = this.bestBoundItems.flatMap((item, i, a) =>
			[{
				...item,
				price: {price: i ? a[i - 1].price.price : maxPrice},
			}, item]);
		return this.itemsToPoints(path);
	}

	itemsToPoints(items) {
		return items.map(item => {
			let y = this.y(item);
			return {
				x: item.price.price,
				y,
				text: `${item.price.priceSummary}, ${round(y, 1)}`,
			};
		});
	}
}

module.exports = ItemsData;

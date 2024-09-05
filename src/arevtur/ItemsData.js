const Emitter = require('../util/Emitter');
const pobApi = require('../services/pobApi/pobApi');


class ItemsData extends Emitter {
	static valueHandlers = [
		{
			name: 'Weight sorting',
			description: 'Sort by considering open affixes, non-blocked crafts, defenses like armor, and item mods according to the weights set above. Less accurate in predicting health & DMG affects on build.',
			sortY: item => item.weightedValue,
			showFilter: item => true,
			trigger: null,
		}, {
			name: 'Build sorting',
			description: 'Sort by changes in effective health, total DPS, and total resists according to the weights set above. Does not consider craftable affixes.',
			sortY: item => item.buildValuePromise.resolved.value,
			showFilter: item => item.buildValuePromise.resolved,
			trigger: item => item.buildValuePromise,
		}, {
			name: 'Build + craft sorting',
			description: 'Sort by changes in effective health, total DPS, and total resists according to the weights set above. Considers craftable affixes.',
			sortY: item => item.craftValuePromise.resolved.value,
			showFilter: item => item.craftValuePromise.resolved,
			trigger: item => item.craftValuePromise,
		},
	];

	constructor() {
		super();
		this.clear();
		this.valueHandler = ItemsData.valueHandlers[0];
		pobApi.addListener('change', () => this.refresh());
	}

	clear() {
		this.allItems = [];
	}

	refresh() {
		let items = this.allItems;
		this.clear();
		this.join(items);
	}

	set valueHandler(valueHandler) {
		this.valueHandler_ = valueHandler;
		this.refresh();
	}

	setValueHandlerByName(name) {
		this.valueHandler_ =
			ItemsData.valueHandlers.find(valueHandler => valueHandler.name === name);
	}

	get y() {
		return this.valueHandler_.sortY;
	}

	join(items) {
		// update items
		let oldLength = this.allItems.length;
		this.allItems = this.allItems
			.concat(items)
			.filter((v, i, a) => {
				let copies = a.filter((vv, i) => vv.id === v.id);
				if (copies[0] !== v)
					return false;
				v.weightedValue = Math.max(...copies.map(vv => vv.weightedValue));
				v.price = Math.min(...copies.map(vv => vv.price));
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
					if (this.allItems.includes(item))
						this.emit('change');
				});
	}

	selectItem(index) {
		this.shownItems[index].selected = !this.shownItems[index].selected;
	}

	hoverItem(index = -1) {
		// index -1 item means no item is hovered
		this.shownItems.forEach((itemI, i) => itemI.hovered = i === index);
	}

	itemIndexByRange(value, price, valueRange, priceRange) {
		let minValue = value - valueRange / 2;
		let maxValue = value + valueRange / 2;
		let minPrice = price - priceRange / 2;
		let maxPrice = price + priceRange / 2;
		return this.shownItems.findIndex(item =>
			this.y(item) > minValue &&
			this.y(item) < maxValue &&
			item.price > minPrice &&
			item.price < maxPrice);
	}

	get shownItems() {
		return this.allItems
			.filter(this.valueHandler_.showFilter)
			// high to low values, low to high prices
			.sort((a, b) => this.y(b) - this.y(a) || a.price - b.price);
	}

	get bestBoundItems() {
		let minPriceFound = Infinity;
		// ordered top right to bottom left
		return this.shownItems.filter(item => {
			if (item.price >= minPriceFound)
				return false;
			minPriceFound = item.price;
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
		let maxPrice = Math.max(...this.shownItems.map(item => item.price));
		let path = this.bestBoundItems.flatMap((item, i, a) =>
			[{
				...item,
				price: i ? a[i - 1].price : maxPrice,
			}, item]);
		return this.itemsToPoints(path);
	}

	itemsToPoints(items) {
		return items.map(item => ({x: item.price, y: this.y(item)}));
	}
}

module.exports = ItemsData;

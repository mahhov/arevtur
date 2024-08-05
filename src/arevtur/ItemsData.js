class ItemsData {
	static valueHandlers = [
		{
			name: 'Eval sorting',
			description: 'Sort by considering open affixes, non-blocked crafts, defenses like armor, and item mods according to the weights set above.',
			handler: item => item.evalValue,
		},
		{
			name: 'Build sorting',
			description: 'Sort by changes in effective health, total dps, and total resists according to the weights set above.',
			handler: item => item.valueBuild.value,
		},
	];

	constructor() {
		this.clear();
		this.valueHandler = ItemsData.valueHandlers[0].name;
	}

	clear() {
		this.items = [];
		this.bestBoundItems = [];
	}

	set valueHandler(name) {
		let entry = ItemsData.valueHandlers.find(entry => entry.name === name) ||
			ItemsData.valueHandlers[0];
		this.y = entry.handler;
		let items = this.items;
		this.clear();
		this.join(items);
	}

	join(items) {
		// update items
		this.items = this.items.concat(items)
			.filter((v, i, a) => {
				// todo deduping sometimes not working
				let copies = a.filter((vv, i) => vv.id === v.id);
				if (copies[0] !== v)
					return false;
				v.evalValue = Math.max(...copies.map(vv => vv.evalValue));
				v.price = Math.min(...copies.map(vv => vv.price));
				// todo is it ok to take the max of each, or should the values of the max-sum be
				// taken?
				v.evalValueDetails = Object.fromEntries(Object.keys(v.evalValueDetails).map(
					valueKey => [valueKey,
						Math.max(...copies.map(copy => copy.evalValueDetails[valueKey]))]));
				return true;
			})
			// high to low values, low to high prices
			.sort((a, b) => this.y(b) - this.y(a) || a.price - b.price);

		// todo use actual max price query param instead of maximum price of items
		this.maxPrice = Math.max(...this.items.map(item => item.price));

		// update bestBoundItems
		let minPriceFound = Infinity;
		// ordered top right to bottom left
		this.bestBoundItems = this.items
			.filter(item => {
				if (item.price >= minPriceFound)
					return false;
				minPriceFound = item.price;
				return true;
			});
	}

	selectItem(index) {
		this.items[index].selected = !this.items[index].selected;
	}

	hoverItem(index = -1) {
		// index -1 item means no item is hovered
		this.items.forEach((itemI, i) => itemI.hovered = i === index);
	}

	itemIndexByRange(value, price, valueRange, priceRange) {
		let minValue = value - valueRange / 2;
		let maxValue = value + valueRange / 2;
		let minPrice = price - priceRange / 2;
		let maxPrice = price + priceRange / 2;
		return this.items.findIndex(item =>
			this.y(item) > minValue &&
			this.y(item) < maxValue &&
			item.price > minPrice &&
			item.price < maxPrice);
	}

	get selectedItems() {
		return this.items.filter(({selected}) => selected);
	}

	get hoveredItems() {
		return this.items.filter(({hovered}) => hovered);
	}

	get bestBoundPath() {
		let path = this.bestBoundItems.flatMap((item, i, a) =>
			[{
				...item,
				price: i ? a[i - 1].price : this.maxPrice,
			}, item]);
		return this.itemsToPoints(path);
	}

	get length() {
		return this.items.length;
	}

	itemsToPoints(items) {
		return items.map(item => ({x: item.price, y: this.y(item)}));
	}
}

module.exports = ItemsData;

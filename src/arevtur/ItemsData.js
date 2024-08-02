class ItemsData {
	constructor() {
		this.clear();
		this.valueHandler = ItemsData.EVAL_SORT_HANDLER;
	}

	static EVAL_VALUE_HANDLER = item => item.evalValue;
	static BUILD_VALUE_HANDLER = item => item.valueBuild.value;

	clear() {
		this.items = [];
		this.bestBoundItems_ = []; // top
	}

	set valueHandler(valueHandler) { // todo use boolean param
		this.y = valueHandler;
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
				v.evalPrice = Math.min(...copies.map(vv => vv.evalPrice));
				// todo is it ok to take the max of each, or should the values of the max-sum be taken?
				v.valueDetails = Object.fromEntries(Object.keys(v.valueDetails).map(valueKey => [valueKey, Math.max(...copies.map(copy => copy.valueDetails[valueKey]))]));
				return true;
			})
			// high to low values, low to high prices
			.sort((a, b) => this.y(b) - this.y(a) || a.evalPrice - b.evalPrice);

		// todo use actual max price query param instead of maximum price of items
		this.maxPrice = Math.max(...items.map(item => item.evalPrice));
		let minAltValue = Math.min(...items.map(item => this.y(item)).filter(v => v > 0));

		// update bestBoundItems
		let minPriceFound = Infinity;
		// ordered top right to bottom left
		this.bestBoundItems_ = this.items
			.filter(item => {
				if (item.evalPrice >= minPriceFound)
					return false;
				minPriceFound = item.evalPrice;
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
			item.evalPrice > minPrice &&
			item.evalPrice < maxPrice);
	}

	get bestBoundItems() {
		return this.bestBoundItems_.filter(item => !item.selected);
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
				evalPrice: i ? a[i - 1].evalPrice : this.maxPrice,
			}, item]);
		return this.itemsToPoints(path);
	}

	get length() {
		return this.items.length;
	}

	itemsToPoints(items) {
		return items.map(item => ({x: item.evalPrice, y: this.y(item)}));
	}
}

module.exports = ItemsData;

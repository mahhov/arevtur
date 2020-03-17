class ItemsData {
	constructor() {
		this.clear();
	}

	clear() {
		this.items = [];
		this.bestBoundItems_ = []; // top
		this.searchBoundItems = []; // bottom
	}

	join(items) {
		// update items
		this.items = this.items.concat(items)
			.filter((v, i, a) => {
				// todo deduping not working
				let copies = a.filter((vv, i) => vv.id === v.id);
				if (copies[0] !== v)
					return false;
				v.evalValue = Math.max(...copies.map(vv => vv.evalValue));
				v.evalPrice = Math.min(...copies.map(vv => vv.evalPrice));
				return true;
			})
			// high to low values, low to high prices
			.sort((a, b) => b.evalValue - a.evalValue || a.evalPrice - b.evalPrice);

		// todo use actual max price query param instead of maximum price of items
		this.maxPrice = Math.max(...items.map(item => item.evalPrice));
		let minValue = Math.min(...items.map(item => item.evalValue).filter(v => v > 0));

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

		// update searchBoundItems
		this.searchBoundItems.push({evalPrice: this.maxPrice, evalValue: minValue});
		let maxPriceFound = -Infinity;
		// ordered bottom left to top right
		this.searchBoundItems = this.searchBoundItems
			.sort((a, b) => a.evalValue - b.evalValue || b.evalPrice - a.evalPrice)
			// low to high value, high to low price
			.filter(item => {
				if (item.evalPrice <= maxPriceFound)
					return false;
				maxPriceFound = item.evalPrice;
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
		return this.items.findIndex(({evalValue, evalPrice}) =>
			evalValue > minValue && evalValue < maxValue && evalPrice > minPrice && evalPrice < maxPrice);
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
		let path = this.bestBoundItems_.flatMap(({evalValue, evalPrice}, i, a) =>
			[{evalValue, evalPrice: i ? a[i - 1].evalPrice : this.maxPrice}, {evalValue, evalPrice}]);
		return ItemsData.itemsToPoints(path);
	}

	get searchBoundPath() {
		let path = this.searchBoundItems.flatMap(({evalValue, evalPrice}, i, a) =>
			[{evalValue, evalPrice: i ? a[i - 1].evalPrice : 0}, {evalValue, evalPrice}]);
		if (!path.length)
			return path;
		let last = path[path.length - 1];
		path.push({evalValue: Infinity, evalPrice: last.evalPrice});
		path.push({evalValue: Infinity, evalPrice: 0});
		return ItemsData.itemsToPoints(path);
	}

	get length() {
		return this.items.length;
	}

	static itemsToPoints(items) {
		return items.map(item => ({x: item.evalPrice, y: item.evalValue}));
	}
}

module.exports = ItemsData;

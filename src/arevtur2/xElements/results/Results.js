const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const ItemsData = require('../../ItemsData');
const Searcher = require('../../Searcher');
const testItems = require('./testItems');

customElements.define(name, class Inputs extends XElement {
	static get attributeTypes() {
		return {};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.itemsData = new ItemsData();

		document.addEventListener('keydown', e => {
			if (e.key === 'f' && e.ctrlKey)
				this.$('#search-input').focus();
		});
		this.$('#search-input').addEventListener('input', () => this.applySearch());

		this.$('#results-chart').addEventListener('action', e =>
			this.emit('submit', {overridePrice: e.detail.x || null}));

		this.$('#results-chart').addEventListener('select', async e => {
			let itemIndex = this.itemsData.itemIndexByRange(e.detail.y, e.detail.x, e.detail.height, e.detail.width);
			if (itemIndex !== -1) {
				this.itemsData.selectItem(itemIndex);
				this.renderItemsData(true);
				this.$('#results-list').children[itemIndex].scrollIntoView({block: 'nearest'});
			}
		});

		this.$('#results-chart').addEventListener('hover', async e => {
			let itemIndex = e.detail &&
				this.itemsData.itemIndexByRange(e.detail.y, e.detail.x, e.detail.height, e.detail.width);
			this.itemsData.hoverItem(itemIndex);
			this.renderItemsData(true);
		});

		// debugging only
		this.itemsData.join(testItems);
		this.renderItemsData(false, true);
	}

	clearItems() {
		this.itemsData.clear();
	}

	joinItems(items) {
		this.itemsData.join(items)
	}

	updateItemsProgress(ratio) {
		this.$('#results-progress-bar').value = ratio;
	}

	renderItemsData(listBackgroundsOnly = false, resetChartRange = false) {
		if (listBackgroundsOnly)
			this.renderItemsDataListBackgroundsOnly();
		else
			this.renderItemsDataList();
		this.renderItemsDataChart(resetChartRange);
	}

	renderItemsDataList() {
		this.$('#results-count').textContent = this.itemsData.length;

		XElement.clearChildren(this.$('#results-list'));
		this.itemsData.items.forEach((itemData, i) => {
			let itemListing = document.createElement('x-item-listing');
			this.$('#results-list').appendChild(itemListing);
			itemListing.addEventListener('select', () => {
				this.itemsData.selectItem(i);
				itemListing.selected = itemData.selected;
				this.renderItemsDataChart();
			});
			itemListing.addEventListener('hover', e => {
				this.itemsData.hoverItem(e.detail && i);
				this.renderItemsData(true);
			});
			itemListing.itemData = itemData;
		});

		this.applySearch();
	}

	renderItemsDataListBackgroundsOnly() {
		[...this.$('#results-list').children].forEach((el, i) => {
			if (i >= this.itemsData.items.length)
				return;
			el.selected = this.itemsData.items[i].selected;
			el.hovered = this.itemsData.items[i].hovered;
		});
	}

	renderItemsDataChart(resetChartRange = false) {
		this.$('#results-chart').pointSets = [
			{
				cssPropertyValueColor: '--interactable-primary',
				size: 1,
				points: this.itemsData.bestBoundPath,
				isPath: true,
			}, {
				cssPropertyValueColor: '--alternate-primary',
				fill: true,
				size: 8,
				points: ItemsData.itemsToPoints(this.itemsData.selectedItems),
			}, {
				cssPropertyValueColor: '--interactable-primary',
				fill: true,
				size: 4,
				points: ItemsData.itemsToPoints(this.itemsData.items),
			}, {
				cssPropertyValueColor: '--alternate-primary',
				fill: true,
				size: 8,
				points: ItemsData.itemsToPoints(this.itemsData.hoveredItems),
			},
		];
		if (resetChartRange)
			this.$('#results-chart').resetRange();
	}

	applySearch() {
		let searcher = new Searcher(this.$('#search-input').value, false);

		[...this.$('#results-list').children].forEach(itemListing => {
			let searchTexts = itemListing.searchTexts;
			let match = searcher.test(searchTexts);
			itemListing.classList.toggle('search-hidden', !match);
		});
	}
});

const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const ItemsData = require('../../ItemsData');
const Searcher = require('../../../util/Searcher');
const Debouncer = require('../../../util/Debouncer');
const {updateElementChildren} = require('../../../util/util');
const testData = require('./testData');

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {expectedCount: {}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.itemsData = new ItemsData();
		let debouncer = new Debouncer(() => this.renderItemsData(false, true), 200);
		this.itemsData.addListener('change', () => debouncer.request());

		this.$('#sort-build-value-input').autocompletes =
			ItemsData.valueHandlers.map(entry => entry.name);
		this.$('#sort-build-value-input').tooltips =
			ItemsData.valueHandlers.map(entry => entry.description);
		this.$('#sort-build-value-input').addEventListener('change', () => {
			localStorage.setItem('results-sort', this.$('#sort-build-value-input').value);
			this.itemsData.setValueHandlerByName(this.$('#sort-build-value-input').value);
			this.renderItemsData(false, true);
		});
		this.$('#sort-build-value-input').value =
			localStorage.getItem('results-sort') || ItemsData.valueHandlers[0].name;
		this.itemsData.setValueHandlerByName(this.$('#sort-build-value-input').value);

		this.$('#price-per-value-input').addEventListener('change', () => {
			localStorage.setItem('results-price-per-value', this.$('#price-per-value-input').value);
			this.itemsData.pricePerValue =
				Number(this.$('#price-per-value-input').value) || Infinity;
			this.renderItemsData(false, true);
		});
		this.$('#price-per-value-input').value = localStorage.getItem('results-price-per-value') || 0;
		this.itemsData.pricePerValue = Number(this.$('#price-per-value-input').value) || Infinity;

		document.addEventListener('keydown', e => {
			if (e.key === 'f' && e.ctrlKey)
				this.$('#search-input').select();
		});
		this.$('#search-input').addEventListener('input', () => this.renderItemsDataList());

		this.$('#results-chart').addEventListener('select', async e => {
			let item = this.itemsData.itemByRange(e.detail.y, e.detail.x, e.detail.height, e.detail.width);
			if (item) {
				this.itemsData.selectItem(item);
				this.renderItemsData(true);
				[...this.$('#results-list').children]
					.find(itemListing => itemListing.itemData === item)
					?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
			}
		});
		this.$('#results-chart').addEventListener('hover', async e => {
			let item = e.detail && this.itemsData.itemByRange(e.detail.y, e.detail.x, e.detail.height, e.detail.width);
			this.itemsData.hoverItem(item);
			this.renderItemsData(true);
		});

		this.expectedCount = 0;
		this.updateResultsCount();

		// testData(this);
	}

	clearItems() {
		this.itemsData.clear();
		this.renderItemsData(false, false);
	}

	joinItems(items) {
		this.itemsData.join(items);
		this.renderItemsData(false, true);
	}

	updateItemsProgress(ratio, expectedCount) {
		this.$('#results-progress-bar').value = ratio;
		this.expectedCount = expectedCount;
		this.updateResultsCount();
	}

	updateResultsCount() {
		this.$('#results-count').textContent = [
			this.itemsData.shownItems.length,
			this.itemsData.allItems.length,
			this.expectedCount,
		].join(' / ');
	}

	renderItemsData(listBackgroundsOnly = false, resetChartRange = false) {
		if (listBackgroundsOnly)
			this.renderItemsDataListBackgroundsOnly();
		else
			this.renderItemsDataList();
		this.renderItemsDataChart(resetChartRange);
	}

	renderItemsDataList() {
		this.updateResultsCount();

		let searcher = new Searcher(this.$('#search-input').value);
		let shownItemsData = this.itemsData.shownItems
			.filter(item => searcher.testMulti(item.displayLines))
			.filter((_, i) => i < 100);

		updateElementChildren(
			this.$('#results-list'),
			shownItemsData,
			(i, items) => {
				let itemListing = document.createElement('x-item-listing');
				itemListing.addEventListener('select', () => {
					this.itemsData.selectItem(itemListing.itemData);
					itemListing.selected = itemListing.itemData.selected;
					this.renderItemsDataChart();
				});
				itemListing.addEventListener('hover', e => {
					this.itemsData.hoverItem(e.detail ? itemListing.itemData : null);
					this.renderItemsData(true);
				});
				return itemListing;
			},
			(itemListing, i, item) => itemListing.itemData = item);
	}

	renderItemsDataListBackgroundsOnly() {
		[...this.$('#results-list').children].forEach((el, i) => {
			if (i >= this.itemsData.shownItems.length)
				return;
			el.selected = el.itemData.selected;
			el.hovered = el.itemData.hovered;
		});
	}

	renderItemsDataChart(resetChartRange = false) {
		this.$('#results-chart').pointSets = [
			{
				cssPropertyValueColor: '--colored-text-blue',
				size: 1,
				points: this.itemsData.bestBoundPath,
				type: 'path',
			}, {
				cssPropertyValueColor: '--colored-text-blue',
				fill: true,
				size: 8,
				points: this.itemsData.itemsToPoints(this.itemsData.selectedItems),
			}, {
				cssPropertyValueColor: '--colored-text-blue',
				fill: true,
				size: 4,
				points: this.itemsData.itemsToPoints(this.itemsData.shownItems
					.filter(item => item.onlineStatus !== 'offline')),
			}, {
				cssPropertyValueColor: '--colored-text-orange',
				fill: true,
				size: 4,
				points: this.itemsData.itemsToPoints(this.itemsData.shownItems
					.filter(item => item.onlineStatus === 'offline')),
			}, {
				cssPropertyValueColor: '--colored-text-blue',
				fill: true,
				size: 8,
				points: this.itemsData.itemsToPoints(this.itemsData.hoveredItems),
			}, {
				points: this.itemsData.itemsToPoints(this.itemsData.shownItems.slice(0, 50)),
				type: 'range',
			},
		];
		this.$('#results-chart').tooltip =
			{
				offset: 3,
				points: this.itemsData.itemsToPoints(this.itemsData.hoveredItems),
			};
		if (resetChartRange)
			this.$('#results-chart').resetRange();
	}
});

// todo[high] refresh results when build weights change

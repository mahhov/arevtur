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
		let debouncer = new Debouncer(() => this.renderItemsData(), 200);
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
		this.$('#price-per-value-input').value = localStorage.getItem('results-price-per-value');
		this.itemsData.pricePerValue = Number(this.$('#price-per-value-input').value) || Infinity;

		document.addEventListener('keydown', e => {
			if (e.key === 'f' && e.ctrlKey)
				this.$('#search-input').select();
		});
		this.$('#search-input').addEventListener('input', () => this.applySearch());

		this.$('#results-chart').addEventListener('select', async e => {
			let itemIndex = this.itemsData.itemIndexByRange(e.detail.y, e.detail.x, e.detail.height,
				e.detail.width);
			if (itemIndex !== -1) {
				this.itemsData.selectItem(itemIndex);
				this.renderItemsData(true);
				this.$('#results-list').children[itemIndex]?.scrollIntoView(
					{behavior: 'smooth', block: 'nearest'});
			}
		});
		this.$('#results-chart').addEventListener('hover', async e => {
			let itemIndex = e.detail &&
				this.itemsData.itemIndexByRange(e.detail.y, e.detail.x, e.detail.height,
					e.detail.width);
			this.itemsData.hoverItem(itemIndex);
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

		updateElementChildren(
			this.$('#results-list'),
			this.itemsData.shownItems.slice(0, 100),
			(i, items) => {
				let itemListing = document.createElement('x-item-listing');
				itemListing.addEventListener('select', () => {
					this.itemsData.selectItem(i);
					itemListing.selected = items[i].selected;
					this.renderItemsDataChart();
				});
				itemListing.addEventListener('hover', e => {
					this.itemsData.hoverItem(e.detail && i);
					this.renderItemsData(true);
				});
				return itemListing;
			},
			(itemListing, i, item) => itemListing.itemData = item);

		this.applySearch();
	}

	renderItemsDataListBackgroundsOnly() {
		[...this.$('#results-list').children].forEach((el, i) => {
			if (i >= this.itemsData.shownItems.length)
				return;
			el.selected = this.itemsData.shownItems[i].selected;
			el.hovered = this.itemsData.shownItems[i].hovered;
		});
	}

	renderItemsDataChart(resetChartRange = false) {
		this.$('#results-chart').pointSets = [
			{
				cssPropertyValueColor: '--colored-text-blue',
				size: 1,
				points: this.itemsData.bestBoundPath,
				isPath: true,
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

	applySearch() {
		let searcher = new Searcher(this.$('#search-input').value);
		[...this.$('#results-list').children].forEach(itemListing => {
			let match = searcher.testMulti(itemListing.searchTexts);
			itemListing.classList.toggle('search-hidden', !match);
		});
	}
});

// todo[high] refresh results when build weights change

const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const ItemsData = require('../../ItemsData');
const Searcher = require('../../Searcher');
const Debouncer = require('../../../Debouncer');
const testData = require('./testData');

customElements.define(name, class Inputs extends XElement {
	static get attributeTypes() {
		return {};
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

		document.addEventListener('keydown', e => {
			if (e.key === 'f' && e.ctrlKey)
				this.$('#search-input').focus();
		});
		this.$('#search-input').addEventListener('input', () => this.applySearch());

		this.$('#results-chart').addEventListener('action', e =>
			this.emit('submit', {overridePrice: e.detail.x || null}));

		this.$('#results-chart').addEventListener('select', async e => {
			let itemIndex = this.itemsData.itemIndexByRange(e.detail.y, e.detail.x, e.detail.height,
				e.detail.width);
			if (itemIndex !== -1) {
				this.itemsData.selectItem(itemIndex);
				this.renderItemsData(true);
				this.$('#results-list').children[itemIndex].scrollIntoView({block: 'nearest'});
			}
		});

		this.$('#results-chart').addEventListener('hover', async e => {
			let itemIndex = e.detail &&
				this.itemsData.itemIndexByRange(e.detail.y, e.detail.x, e.detail.height,
					e.detail.width);
			this.itemsData.hoverItem(itemIndex);
			this.renderItemsData(true);
		});

		// testData(this);
	}

	clearItems() {
		this.itemsData.clear();
	}

	joinItems(items) {
		this.itemsData.join(items);
		this.renderItemsData(false, true);
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
		this.$('#results-count').textContent =
			this.itemsData.shownItems.length + ' / ' + this.itemsData.allItems.length;

		XElement.clearChildren(this.$('#results-list'));
		this.itemsData.shownItems.forEach((itemData, i) => {
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
			if (i >= this.itemsData.shownItems.length)
				return;
			el.selected = this.itemsData.shownItems[i].selected;
			el.hovered = this.itemsData.shownItems[i].hovered;
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
				points: this.itemsData.itemsToPoints(this.itemsData.selectedItems),
			}, {
				cssPropertyValueColor: '--interactable-primary',
				fill: true,
				size: 4,
				points: this.itemsData.itemsToPoints(this.itemsData.shownItems),
			}, {
				cssPropertyValueColor: '--alternate-primary',
				fill: true,
				size: 8,
				points: this.itemsData.itemsToPoints(this.itemsData.hoveredItems),
			},
		];
		if (resetChartRange)
			this.$('#results-chart').resetRange();
	}

	applySearch() {
		let searcher = new Searcher(this.$('#search-input').value, false);
		[...this.$('#results-list').children].forEach(itemListing => {
			let match = searcher.test(itemListing.searchTexts);
			itemListing.classList.toggle('search-hidden', !match);
		});
	}
});

// todo [high] scrolling chart also scrolls results underneath
// todo [high] query ignoring max price

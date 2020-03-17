const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const ApiConstants = require('../../ApiConstants');
const {QueryParams} = require('../../DataFetcher');

customElements.define(name, class Inputs extends XElement {
	static get attributeTypes() {
		return {};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#league-input').value = localStorage.getItem('input-league');
		this.inputSetIndex = Number(localStorage.getItem('input-set-index')) || 0;
		this.inputSets = JSON.parse(localStorage.getItem('input-sets')) || [{}];
		this.sharedWeightEntries = JSON.parse(localStorage.getItem('shared-weight-entries')) || [];

		this.$('#league-input').addEventListener('input', () => this.store());

		this.$('#input-set-list').addEventListener('arrange', e => {
			let [removed] = this.inputSets.splice(e.detail.from, 1);
			this.inputSets.splice(e.detail.to, 0, removed);
			this.store();
		});
		this.$('#add-input-set-button').addEventListener('click', e => {
			this.inputSets.push({});
			let inputSetEl = this.addInputSetEl();
			this.setInputSetIndex(this.inputSets.length - 1, null, !e.ctrlKey);
			this.store();
		});
		this.$('#input-params').addEventListener('change', () => {
			this.inputSets[this.inputSetIndex].queryParams = this.$('#input-params').queryParams;
			this.sharedWeightEntries = this.$('#input-params').sharedWeightEntries;
			this.store();
		});
		this.$('#submit-button').addEventListener('click', e => this.emit('submit', {add: e.ctrlKey}));

		this.inputSets.forEach(inputSet => {
			let inputSetEl = this.addInputSetEl();
			inputSetEl.name = inputSet.name;
			inputSetEl.active = inputSet.active;
		});
		this.setInputSetIndex(this.inputSetIndex);
	}

	setInputSetIndex(index, fromEl = null, exclusive = true) {
		// if fromEl is specified, index is ignored
		let indexSetEls = [...this.$('#input-set-list').children];
		this.inputSetIndex = fromEl ? indexSetEls.indexOf(fromEl) : index;
		if (exclusive) {
			indexSetEls.forEach(indexSetEl => indexSetEl.active = false);
			this.inputSets.forEach(indexSet => indexSet.active = false);
		}
		indexSetEls.forEach(indexSetEl => indexSetEl.selected = false);
		indexSetEls[this.inputSetIndex].active = true;
		this.inputSets[this.inputSetIndex].active = true;
		// todo propagating to both elements and js objects is cumbersome
		indexSetEls[this.inputSetIndex].selected = true;
		this.$('#input-params').loadQueryParams(this.inputSets[this.inputSetIndex].queryParams, this.sharedWeightEntries);
	}

	inputSetIndexFromEl(inputSetEl) {
		let indexSetEls = [...this.$('#input-set-list').children];
		return indexSetEls.indexOf(inputSetEl);
	}

	inputSetFromEl(inputSetEl) {
		let index = this.inputSetIndexFromEl(inputSetEl);
		return this.inputSets[index];
	}

	addInputSetEl() {
		let inputSetEl = document.createElement('x-input-set');
		inputSetEl.slot = 'list';
		this.$('#input-set-list').appendChild(inputSetEl);
		inputSetEl.addEventListener('click', e =>
			this.setInputSetIndex(0, inputSetEl, !e.ctrlKey));
		inputSetEl.addEventListener('name-change', () => {
			this.inputSetFromEl(inputSetEl).name = inputSetEl.name;
			this.store();
		});
		inputSetEl.addEventListener('remove', () => {
			let index = this.inputSetIndexFromEl(inputSetEl);
			if (this.inputSetIndex >= index && this.inputSetIndex)
				this.inputSetIndex--;
			this.inputSets.splice(index, 1);
			inputSetEl.remove();
			if (!this.inputSets.length) {
				this.inputSets.push({});
				this.addInputSetEl();
				this.setInputSetIndex(0);
			} else
				this.setInputSetIndex(this.inputSetIndex);
			this.store();
		});
		return inputSetEl;
	}

	store() {
		localStorage.setItem('input-league', this.$('#league-input').value);
		localStorage.setItem('input-set-index', this.inputSetIndex);
		localStorage.setItem('input-sets', JSON.stringify(this.inputSets));
		localStorage.setItem('shared-weight-entries', JSON.stringify(this.sharedWeightEntries));
	}

	getQueries(overridePrice = null) {
		return this.inputSets
			.filter(inputSet => inputSet.active)
			.flatMap(inputSet => {
				let {
					type, maxPrice,
					defenseProperties, affixProperties, linked,
					weightEntries, andEntries, notEntries
				} = inputSet.queryParams;
				maxPrice = overridePrice !== null ? overridePrice : maxPrice;
				let weights = Object.fromEntries([...weightEntries, ...this.sharedWeightEntries]);
				let ands = Object.fromEntries(andEntries);
				let nots = Object.fromEntries(notEntries);

				let queries = [];

				let query = new QueryParams();
				query.league = this.$('#league-input').value;
				query.type = type;
				query.maxPrice = maxPrice;
				query.defenseProperties = defenseProperties;
				query.linked = linked;
				query.weights = weights;
				query.ands = ands;
				query.nots = nots;

				let linkedOptions = [false, linked && maxPrice > ApiConstants.CURRENCIES.fatedConnectionsProphecy.chaos ? true : null];
				let affixOptions = [false, affixProperties.prefix ? 'prefix' : null, affixProperties.suffix ? 'suffix' : null];

				linkedOptions
					.filter(lo => lo !== null)
					.forEach(lo =>
						affixOptions
							.filter(ao => ao !== null)
							.forEach(ao => {
								let queryO = new QueryParams(query);
								if (lo) {
									queryO.linked = true;
									queryO.uncorrupted = true;
									queryO.maxPrice -= ApiConstants.CURRENCIES.fatedConnectionsProphecy.chaos;
									queryO.priceShift += ApiConstants.CURRENCIES.fatedConnectionsProphecy.chaos;
								}
								if (ao === 'prefix') {
									queryO.affixProperties.prefix = true;
									queryO.uncorrupted = true;
									queryO.uncrafted = true;
									queryO.affixValueShift += affixProperties.prefix;
								} else if (ao === 'suffix') {
									queryO.affixProperties.suffix = true;
									queryO.uncorrupted = true;
									queryO.uncrafted = true;
									queryO.affixValueShift += affixProperties.suffix;
								}
								queries.push(queryO);
							}));

				return queries;
			});
	}
});

const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const {configForRenderer} = require('../../../services/configForRenderer');
const ApiConstants = require('../../ApiConstants');
const {QueryImport} = require('../../DataFetcher');
const UnifiedQueryParams = require('../../UnifiedQueryParams');

let timestamp = () => {
	let date = new Date();
	return `${date.toLocaleTimeString()} ${date.toLocaleDateString()}`;
};

customElements.define(name, class Inputs extends XElement {
	static get attributeTypes() {
		return {};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		configForRenderer.listenConfigChange(async config => {
			this.$('#league-input').value = config.league;
			this.$('#loaded-currencies-status').classList.remove('valid');
			await ApiConstants.constants.currencyPrices(config.league);
			if (config.league === configForRenderer.config.league)
				this.$('#loaded-currencies-status').classList.add('valid');
		});

		ApiConstants.constants.leagues.then(leagues =>
			this.$('#league-input').autocompletes = leagues);
		this.$('#session-id-input').value = localStorage.getItem('input-session-id');
		this.inputSetIndex = Number(localStorage.getItem('input-set-index')) || 0;
		// todo try catch JSON.parse
		this.inputSets = JSON.parse(localStorage.getItem('input-sets')) || [{}];
		this.sharedWeightEntries = JSON.parse(localStorage.getItem('shared-weight-entries')) || [];

		ApiConstants.constants.leagues.then(() =>
			this.$('#loaded-leagues-status').classList.add('valid'));
		ApiConstants.constants.types.then(() =>
			this.$('#loaded-types-status').classList.add('valid'));
		ApiConstants.constants.properties.then(() =>
			this.$('#loaded-properties-status').classList.add('valid'));
		ApiConstants.constants.items.then(() =>
			this.$('#loaded-items-status').classList.add('valid'));

		this.$('#league-input').addEventListener('change', () => this.store());
		this.$('#session-id-input').addEventListener('input', () => this.store());

		this.$('#input-build').addEventListener('refreshing', e =>
			this.$('#loaded-pob-status').classList.remove('valid'));
		this.$('#input-build').addEventListener('refresh', e => {
			this.$('#loaded-pob-status').classList.add('valid');
			this.$('#input-trade-params').refreshBuild(e.detail);
		});

		this.$('#input-import-trade-search-url').addEventListener('import', async e => {
			let queryImport = new QueryImport(this.$('#session-id-input').value, e.detail);
			let apiQueryParams = await queryImport.getApiQueryParams();
			let unifiedQueryParams = UnifiedQueryParams.fromApiQueryParams(apiQueryParams);
			this.inputSets.push({name: `imported ${timestamp()}}`, active: false, queryParams: unifiedQueryParams});
			this.addInputSetEl();
			this.setInputSetIndex(this.inputSets.length - 1);
			this.store();
		});

		this.$('#input-set-list').addEventListener('arrange', e => {
			let [removed] = this.inputSets.splice(e.detail.from, 1);
			this.inputSets.splice(e.detail.to, 0, removed);
			this.store();
		});
		this.$('#add-input-set-button').addEventListener('click', e => {
			this.inputSets.push({name: timestamp()});
			this.addInputSetEl();
			this.setInputSetIndex(this.inputSets.length - 1, null, !e.ctrlKey);
			this.store();
		});
		this.$('#input-trade-params').addEventListener('change', () => {
			this.inputSets[this.inputSetIndex].queryParams = this.$('#input-trade-params').queryParams;
			this.sharedWeightEntries = this.$('#input-trade-params').sharedWeightEntries;
			this.store();
		});
		this.$('#submit-button').addEventListener('click', e => this.emit('submit', {add: e.ctrlKey}));
		this.$('#cancel-button').addEventListener('click', e => this.emit('cancel'));
		this.$('#hide-button').addEventListener('click', e => this.$('#input-trade-params').classList.toggle('hidden'));

		this.inputSets.forEach(inputSet => {
			let inputSetEl = this.addInputSetEl();
			inputSetEl.name = inputSet.name;
			inputSetEl.active = inputSet.active;
		});
		this.setInputSetIndex(this.inputSetIndex);
	}

	async setInputSetIndex(index, fromEl = null, exclusive = true) {
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
		let unifiedQueryParams = UnifiedQueryParams.fromStorageQueryParams(this.inputSets[this.inputSetIndex].queryParams, this.sharedWeightEntries);
		await this.$('#input-trade-params').loadQueryParams(unifiedQueryParams);
		this.$('#input-trade-params').refreshBuild(this.itemEval);
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
		inputSetEl.name = this.inputSets[this.inputSets.length - 1].name;
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
				this.inputSets.push({name: timestamp()});
				this.addInputSetEl();
				this.setInputSetIndex(0);
			} else
				this.setInputSetIndex(this.inputSetIndex);
			this.store();
		});
		return inputSetEl;
	}

	store() {
		configForRenderer.config = {'league': this.$('#league-input').value};
		localStorage.setItem('input-session-id', this.$('#session-id-input').value);
		localStorage.setItem('input-set-index', this.inputSetIndex);
		localStorage.setItem('input-sets', JSON.stringify(this.inputSets));
		localStorage.setItem('shared-weight-entries', JSON.stringify(this.sharedWeightEntries));
	}

	async getQueryParamsDatas(overridePrice = null) {
		let currencyPrices = await ApiConstants.constants.currencyPrices(configForRenderer.config.league);
		let fatedConnectionsProphecyPrice = currencyPrices['fatedConnectionsProphecy'];
		let league = this.$('#league-input').value;
		let sessionId = this.$('#session-id-input').value;
		return this.inputSets
			.filter(inputSet => inputSet.active)
			.flatMap(inputSet =>
				UnifiedQueryParams
					.fromStorageQueryParams(inputSet.queryParams, this.sharedWeightEntries)
					.toDataFetcherQueryParamsDatas(league, sessionId, overridePrice, fatedConnectionsProphecyPrice));
	}

	get itemEval() {
		return this.$('#input-build').itemEval;
	}
});

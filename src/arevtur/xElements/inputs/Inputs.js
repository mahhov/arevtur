const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const {configForRenderer} = require('../../../services/configForRenderer');
const ApiConstants = require('../../ApiConstants');
const {TradeQuery} = require('../../poeTradeApi');
const UnifiedQueryParams = require('../../UnifiedQueryParams');
const pobApi = require('../../../pobApi/pobApi');
const util = require('../../../util/util');
const ItemData = require('../../ItemData');

let timestamp = () => {
	let date = new Date();
	return date.toLocaleDateString();
	// return `${date.toLocaleTimeString()} ${date.toLocaleDateString()}`;
};

customElements.define(name, class Inputs extends XElement {
	static get attributeTypes() {
		return {};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		configForRenderer.addListener('change', config => this.onConfigChange(config));
		this.onConfigChange(configForRenderer.config);

		ApiConstants.constants.leagues.then(leagues =>
			this.$('#league-input').autocompletes = leagues);
		this.$('#session-id-input').value = localStorage.getItem('input-session-id');
		this.inputSetIndex = Number(localStorage.getItem('input-set-index')) || 0;
		// todo[high] try catch JSON.parse
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
		this.$('#session-id-input').addEventListener('change', () => this.store());

		this.$('#refresh-button').addEventListener('click', () => window.location.reload());

		// todo[medium] likewise use busy for other status chips to differentiate between loading
		//  and failed
		pobApi.addListener('not-ready', () =>
			this.$('#loaded-pob-status').classList.remove('valid', 'busy'));
		pobApi.addListener('busy', queueLength => {
			this.$('#loaded-pob-status').classList.add('valid');
			this.$('#loaded-pob-status').classList.toggle('busy', queueLength);
			this.$('#loaded-pob-status #queue-length').textContent =
				queueLength ? `(${queueLength})` : '';
		});

		// todo[medium] sometimes returns 'error 6 / forbidden'
		this.$('#input-import-trade-search-url').addEventListener('import-url', async e => {
			let apiQueryParams =
				await TradeQuery.fromApiHtmlUrl(this.$('#session-id-input').value, e.detail);
			let unifiedQueryParams = UnifiedQueryParams.fromApiQueryParams(apiQueryParams);
			this.importInputSet(unifiedQueryParams);
		});

		this.$('#input-import-trade-search-url').addEventListener('import-item-text', async e => {
			let typeText = ItemData.typeNameFromItemText(e.detail);
			let typeId = await ApiConstants.constants.typeTextToId(typeText);

			let propertyTexts = await ApiConstants.constants.propertyTexts();
			let matchedPropertyIds = await Promise.all(e.detail
				.split('\n')
				.map(line => line.trim())
				.map(line => line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
				.map(line => line.replaceAll('decrease', '(decrease|increase)'))
				.map(line => line.replaceAll(/(\d+)/g, '($1|#)'))
				.map(line => `^${line}( \\(\\explicit+\\))?$`)
				.map(line => new RegExp(line))
				// todo[low] sometimes, there are multiple properties with the same text. should do
				//   an 'or' between them. e.g. '+# to Strength and Intelligence'
				.map(regex => propertyTexts.find(pt => pt.match(regex)))
				.filter(propertyText => propertyText)
				.map(propertyText => ApiConstants.constants.propertyTextToId(propertyText)));

			let unifiedQueryParams = UnifiedQueryParams.fromPropertyIds(typeId, matchedPropertyIds);
			this.importInputSet(unifiedQueryParams);
		});

		this.$('#input-set-list').addEventListener('arrange', e => {
			let [removed] = this.inputSets.splice(e.detail.from, 1);
			this.inputSets.splice(e.detail.to, 0, removed);
			this.store();
		});
		this.$('#add-input-set-button').addEventListener('click', e => {
			// todo[low] if user doesn't override name, append item type when selected
			this.inputSets.push({name: timestamp()});
			this.addInputSetEl();
			this.setInputSetIndex(this.inputSets.length - 1, null, !e.ctrlKey);
			this.store();
		});
		this.$('#close-all-input-sets-button').addEventListener('click', e => {
			this.clearChildren('#input-set-list');
			this.inputSets = [{name: timestamp()}];
			this.addInputSetEl();
			this.setInputSetIndex(0);
			this.store();
		});

		this.$('#input-trade-params').addEventListener('change', async () => {
			let unifiedQueryParams = await this.$('#input-trade-params').unifiedQueryParams;
			this.inputSets[this.inputSetIndex].unifiedQueryParams = unifiedQueryParams;
			this.sharedWeightEntries = unifiedQueryParams.sharedWeightEntries;
			this.store();
		});

		document.addEventListener('keydown', e => {
			if (e.key === 'Enter' && e.ctrlKey)
				this.emit('submit', {add: false});
			if (e.key === 'r' && e.ctrlKey)
				window.location.reload();
		});
		this.$('#submit-button')
			.addEventListener('click', e => this.emit('submit', {add: e.ctrlKey}));
		this.$('#cancel-button').addEventListener('click', e => this.emit('cancel'));

		this.inputSets.forEach(inputSet => {
			let inputSetEl = this.addInputSetEl();
			inputSetEl.name = inputSet.name;
		});
		this.setInputSetIndex(this.inputSetIndex);

		// todo[high] replace this with explicit calls when inputs change
		setInterval(() => this.finalizeTradeQuery(), 1000);
	}

	async onConfigChange(config) {
		this.$('#league-input').value = config.league;
		this.$('#loaded-currencies-status').classList.remove('valid');
		await ApiConstants.constants.currencyPrices(config.league);
		if (config.league === configForRenderer.config.league)
			this.$('#loaded-currencies-status').classList.add('valid');
	}

	importInputSet(unifiedQueryParams) {
		this.inputSets.push(
			{
				name: `imported ${timestamp()}`,
				active: false,
				unifiedQueryParams,
			});
		this.addInputSetEl();
		this.setInputSetIndex(this.inputSets.length - 1);
		this.store();
	}

	async setInputSetIndex(index, fromEl = null, exclusive = true) {
		// if fromEl is specified, index is ignored
		let indexSetEls = [...this.$('#input-set-list').children];
		this.inputSetIndex = fromEl ? indexSetEls.indexOf(fromEl) : index;
		if (exclusive) {
			indexSetEls.forEach(indexSetEl => indexSetEl.classList.remove('active'));
			this.inputSets.forEach(indexSet => indexSet.active = false);
		}
		indexSetEls.forEach(indexSetEl => indexSetEl.classList.remove('selected'));
		indexSetEls[this.inputSetIndex].classList.add('active');
		this.inputSets[this.inputSetIndex].active = true;
		indexSetEls[this.inputSetIndex].classList.add('selected');
		let unifiedQueryParams = UnifiedQueryParams.fromStorageQueryParams(
			this.inputSets[this.inputSetIndex].unifiedQueryParams, this.sharedWeightEntries);
		await this.$('#input-trade-params').loadQueryParams(unifiedQueryParams);
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

	async finalizeTradeQuery(overridePrice = null) {
		let currencyPrices = await ApiConstants.constants.currencyPrices(
			configForRenderer.config.league);
		let manual6LinkOptions = [
			['fuse6LinkBenchCraft', currencyPrices.fuse6LinkBenchCraft],
			['theBlackMorrigan6LinkBeastCraft', currencyPrices.theBlackMorrigan6LinkBeastCraft],
		];
		let manual6LinkCheapestOption = manual6LinkOptions[
			util.minIndex(manual6LinkOptions.map(v => v[1]))];

		let league = this.$('#league-input').value;
		let sessionId = this.$('#session-id-input').value;
		let tradeQueries = this.inputSets
			.filter(inputSet => inputSet.active)
			.flatMap(inputSet =>
				UnifiedQueryParams
					.fromStorageQueryParams(inputSet.unifiedQueryParams, this.sharedWeightEntries)
					.toTradeQueryData(league, sessionId, overridePrice,
						manual6LinkCheapestOption[0], manual6LinkCheapestOption[1])
					.map(data => new TradeQuery(data)));

		// todo[medium] move this to InputTradeParams and remove import button, instead
		//  automatically update url <-> form when either one changes
		this.$('#input-import-trade-search-url').url = tradeQueries[0].toApiHtmlUrl;

		return tradeQueries;
	}
});

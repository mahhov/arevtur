const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const {shell} = require('electron');
const configForRenderer = require('../../../services/config/configForRenderer');
const apiConstants = require('../../apiConstants');
const TradeQuery = require('../../TradeQuery');
const UnifiedQueryParams = require('../../UnifiedQueryParams');
const pobApi = require('../../../services/pobApi/pobApi');
const {minIndex, unique, escapeRegex} = require('../../../util/util');
const ItemData = require('../../ItemData');
const appData = require('../../../services/appData');
const BugReport = require('../../BugReport');
const TradeQueryQueue = require('../../TradeQueryQueue');
const googleAnalyticsForRenderer = require('../../../services/googleAnalytics/googleAnalyticsForRenderer');

let timestamp = () => {
	let date = new Date();
	return date.toLocaleDateString();
};

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		configForRenderer.addListener('change', config => this.onConfigChange(config));

		this.inputSetIndex = Number(localStorage.getItem('input-set-index')) || 0;
		// todo[high] try catch JSON.parse
		this.inputSets = JSON.parse(localStorage.getItem('input-sets')) || [{name: timestamp()}];
		this.sharedWeightEntries = JSON.parse(localStorage.getItem('shared-weight-entries')) || [];

		this.$('#version-input').autocompletes = ['PoE 1', 'PoE 2'];
		this.$('#version-input').addEventListener('change', () => this.store());
		this.$('#league-input').addEventListener('change', () => this.store());
		this.$('#session-id-input').addEventListener('change', () => this.store());

		this.$('#bug-report-button').addEventListener('click', async () =>
			(await BugReport.fromCurrentState()).toDownload());
		this.$('#bug-report-button').addEventListener('dragover', e => e.preventDefault());
		this.$('#bug-report-button').addEventListener('drop', async e => {
			e.preventDefault();
			if (appData.isDev) {
				let path = e.dataTransfer.files[0].path;
				(await BugReport.fromDownload(path))?.toCurrentState();
			}
		});

		pobApi.addListener('not-ready', () => {
			this.$('#loaded-pob-status').classList.add('invalid');
			this.$('#loaded-pob-status #queue-length').textContent = '';
		});
		pobApi.addListener('busy', queueLength => {
			this.$('#loaded-pob-status').classList.remove('invalid');
			this.$('#loaded-pob-status').classList.toggle('valid', !queueLength);
			this.$('#loaded-pob-status #queue-length').textContent =
				queueLength ? `(${queueLength})` : '';
		});

		// todo[medium] sometimes returns 'error 6 / forbidden'
		this.$('#input-imports').addEventListener('import-url', async e => {
			let apiQueryParams =
				await TradeQuery.fromApiHtmlUrl(this.$('#session-id-input').value, e.detail);
			let unifiedQueryParams = await UnifiedQueryParams.fromApiQueryParams(apiQueryParams);
			this.addInputSet(`imported from URL ${timestamp()}`, unifiedQueryParams);
		});

		this.$('#input-imports').addEventListener('import-item-text', async e => {
			let typeText = ItemData.typeFromItemText(e.detail) || 'Any';

			let propertyTexts = await apiConstants.propertyTexts();
			let matchedPropertyTexts = (await Promise.all(e.detail
				.split('\n')
				.map(line => line.trim())
				.map(line => line)
				.map(escapeRegex)
				.map(line => line.replaceAll(/decrease|reduce/g, '(decrease|reduce|increase)'))
				.map(line => line.replaceAll(/(\d+)/g, '($1|#)'))
				.map(line => `(^|\n)${line}( \\(\\explicit+\\))?($|\n)`)
				.map(line => new RegExp(line))
				// todo[low] sometimes, there are multiple properties with the same text.
				// should do an 'or' between them. e.g. '+# to Strength and Intelligence'
				.map(regex => propertyTexts.find(pt => pt.match(regex)))
				.filter(propertyText => propertyText)
				.filter(unique)
				.map(propertyText => apiConstants.propertyByText(propertyText))))
				.filter(property => property)
				.map(property => property.text);

			let unifiedQueryParams =
				await UnifiedQueryParams.fromPropertyIds(typeText, matchedPropertyTexts);
			this.addInputSet(`imported from text ${timestamp()}`, unifiedQueryParams);
		});

		this.$('#input-imports').addEventListener('import-weight-list', e => {
			let weights = e.detail.split('\n');
			this.inputSets[this.inputSetIndex].unifiedQueryParams.weightEntries
				.filter(weightEntry => !weightEntry.locked)
				.forEach((weightEntry, i) => weightEntry.weight = Number(weights[i]) || 0);
			this.setInputSetIndex(this.inputSetIndex);
			this.store();
		});

		this.$('#input-set-list').addEventListener('arrange', e => {
			let [removed] = this.inputSets.splice(e.detail.from, 1);
			this.inputSets.splice(e.detail.to, 0, removed);
			this.store();
		});
		this.$('#add-input-set-button').addEventListener('click', e => {
			// todo[low] if user doesn't override name, append item type when selected
			this.inputSets.push({name: timestamp(), tradeQueries: []});
			this.addInputSetEl();
			this.setInputSetIndex(this.inputSets.length - 1, null);
			this.store();
		});
		this.$('#duplicate-input-set-button').addEventListener('click', e =>
			this.addInputSet(`${this.inputSets[this.inputSetIndex].name} (copy)`,
				this.inputSets[this.inputSetIndex].unifiedQueryParams));
		this.$('#clear-all-input-sets-button').addEventListener('click', e => {
			this.clearChildren('#input-set-list');
			this.inputSets = [{name: timestamp()}];
			this.addInputSetEl();
			this.setInputSetIndex(0);
			this.store();
		});

		this.$('#input-trade-params').addEventListener('change', () => {
			let unifiedQueryParams = this.$('#input-trade-params').unifiedQueryParams;
			this.inputSets[this.inputSetIndex].unifiedQueryParams = unifiedQueryParams;
			this.sharedWeightEntries = unifiedQueryParams.sharedWeightEntries;
			this.store();
		});

		this.tradeQueryQueue = new TradeQueryQueue();
		this.tradeQueryQueue.addListener('items', items =>
			this.emit('add-items', {clear: false, items}));
		this.tradeQueryQueue.addListener('progress', arg =>
			this.emit('progress', arg));
		this.tradeQueryQueue.addListener('error', error => {
			console.error('TradeQuery error', error);
			if (error?.message.includes('Logging in')) {
				this.$('#session-id-input').value = '';
				this.store();
			}
		});

		document.addEventListener('keydown', e => {
			if (e.key === 'Enter' && e.ctrlKey)
				this.onSubmit(e.altKey);
			if (e.key === 'r' && e.ctrlKey)
				window.location.reload();
		});
		this.$('#search-button').addEventListener('click', e => this.onSubmit(e.altKey));
		this.$('#cancel-button').addEventListener('click', () => this.tradeQueryQueue.cancel());
		this.$('#search-in-browser-button').addEventListener('click', async () => {
			googleAnalyticsForRenderer.emit('SearchBrowser');
			shell.openExternal(await (await this.finalizeTradeQuery())[0].toApiHtmlUrl());
		});

		this.inputSets.forEach(inputSet => {
			let inputSetEl = this.addInputSetEl();
			inputSetEl.name = inputSet.name;
		});
		this.setInputSetIndex(this.inputSetIndex);
	}

	get isVersion2() {
		return this.$('#version-input').value === this.$('#version-input').autocompletes[1];
	}

	updateStatusIndicator(promise, element) {
		let version2 = this.isVersion2;
		let league = this.$('#league-input').value;
		let stillCurrent = () => league === this.$('#league-input').value && version2 === this.isVersion2;

		element.classList.add('busy');
		element.classList.remove('valid', 'invalid');
		promise
			.then(() => {
				if (stillCurrent())
					element.classList.add('valid');
			})
			.catch(() => {
				if (stillCurrent())
					element.classList.add('invalid');
			});
	}

	async onConfigChange(config) {
		this.$('#version-input').value = this.$('#version-input').autocompletes[Number(config.version2)];
		this.$('#league-input').value = config.league;
		this.$('#session-id-input').value = config.sessionId;

		this.$('#league-input').autocompletes = await apiConstants.leagues;

		this.updateStatusIndicator(
			apiConstants.leagues,
			this.$('#loaded-leagues-status'));
		this.updateStatusIndicator(
			apiConstants.types,
			this.$('#loaded-types-status'));
		this.updateStatusIndicator(
			apiConstants.properties,
			this.$('#loaded-properties-status'));
		this.updateStatusIndicator(
			apiConstants.currencyPrices(config.league),
			this.$('#loaded-currencies-status'));
		this.updateStatusIndicator(
			apiConstants.items,
			this.$('#loaded-items-status'));
	}

	addInputSet(name, unifiedQueryParams) {
		this.inputSets.push({
			name,
			unifiedQueryParams,
			tradeQueries: [],
		});
		this.addInputSetEl();
		this.setInputSetIndex(this.inputSets.length - 1);
		this.store();
	}

	setInputSetIndex(index, fromEl = null) {
		// if fromEl is specified, index is ignored
		let indexSetEls = [...this.$('#input-set-list').children];
		this.inputSetIndex = fromEl ? indexSetEls.indexOf(fromEl) : index;
		indexSetEls.forEach(indexSetEl => indexSetEl.classList.remove('selected'));
		indexSetEls[this.inputSetIndex].classList.add('selected');

		let unifiedQueryParams = UnifiedQueryParams.fromStorageQueryParams(
			this.inputSets[this.inputSetIndex].unifiedQueryParams, this.sharedWeightEntries);
		this.$('#input-trade-params').setUnifiedQueryParams(unifiedQueryParams, true);

		this.tradeQueryQueue.setActiveTradeQueries(this.inputSets[this.inputSetIndex].tradeQueries);
		this.emit('add-items', {clear: true, items: this.tradeQueryQueue.activeTradeQueriesItems});
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
			this.setInputSetIndex(0, inputSetEl));
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
				this.inputSets.push({name: timestamp(), tradeQueries: []});
				this.addInputSetEl();
				this.setInputSetIndex(0);
			} else
				this.setInputSetIndex(this.inputSetIndex);
			this.store();
		});
		return inputSetEl;
	}

	store() {
		configForRenderer.config = {
			version2: this.isVersion2,
			league: this.$('#league-input').value,
			sessionId: this.$('#session-id-input').value,
		};
		localStorage.setItem('input-set-index', this.inputSetIndex);
		localStorage.setItem('input-sets', JSON.stringify(this.inputSets.map(inputSet => ({
			...inputSet,
			tradeQueries: [],
		}))));
		localStorage.setItem('shared-weight-entries', JSON.stringify(this.sharedWeightEntries));
	}

	async onSubmit(all) {
		this.tradeQueryQueue.cancel();
		if (all) {
			googleAnalyticsForRenderer.emit('SearchAll');
			for (let i in this.inputSets)
				await this.queueTradeQuery(i);
		} else {
			googleAnalyticsForRenderer.emit('Search');
			await this.queueTradeQuery(this.inputSetIndex);
		}
		this.tradeQueryQueue.setActiveTradeQueries(this.inputSets[this.inputSetIndex].tradeQueries);
		this.emit('add-items', {clear: true, items: []});
	}

	async queueTradeQuery(i) {
		this.inputSets[i].tradeQueries = [];
		let tradeQueries = await this.finalizeTradeQuery(i);
		this.tradeQueryQueue.addQueries(tradeQueries);
		this.inputSets[i].tradeQueries = tradeQueries;
	}

	async finalizeTradeQuery(index = this.inputSetIndex) {
		let version2 = this.isVersion2;
		let league = this.$('#league-input').value;
		let sessionId = this.$('#session-id-input').value;

		let manual6LinkCheapestOption = [];
		if (!version2) {
			// todo[medium] re-add 6-link support for poe 1 queries
			let currencyPrices = await apiConstants.currencyPrices(league);
			let manual6LinkOptions = [
				['fuse6LinkBenchCraft', currencyPrices.fuse6LinkBenchCraft],
				['theBlackMorrigan6LinkBeastCraft', currencyPrices.theBlackMorrigan6LinkBeastCraft],
			];
			manual6LinkCheapestOption = manual6LinkOptions[minIndex(manual6LinkOptions.map(v => v[1]))];
		}

		let tradeQueryData = await UnifiedQueryParams
			.fromStorageQueryParams(this.inputSets[index].unifiedQueryParams, this.sharedWeightEntries)
			.toTradeQueryData(version2, league, manual6LinkCheapestOption[0], manual6LinkCheapestOption[1]);
		return tradeQueryData
			.map(data => new TradeQuery(data, version2, league, sessionId, data.affixValueShift, data.priceShifts));
	}
});

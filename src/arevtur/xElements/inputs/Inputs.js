const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const {shell} = require('electron');
const configForRenderer = require('../../../services/config/configForRenderer');
const apiConstants = require('../../apiConstants');
const TradeQuery = require('../../TradeQuery');
const UnifiedQueryParams = require('../../UnifiedQueryParams');
const pobApi = require('../../../services/pobApi/pobApi');
const {minIndex, unique, escapeRegex, openPath} = require('../../../util/util');
const ItemData = require('../../ItemData');
const appData = require('../../../services/appData');
const BugReport = require('../../BugReport');

let timestamp = () => {
	let date = new Date();
	return date.toLocaleDateString();
	// return `${date.toLocaleTimeString()} ${date.toLocaleDateString()}`;
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
		this.onConfigChange(configForRenderer.config);

		apiConstants.leagues.then(leagues =>
			this.$('#league-input').autocompletes = leagues);
		this.$('#session-id-input').value = localStorage.getItem('input-session-id');
		this.inputSetIndex = Number(localStorage.getItem('input-set-index')) || 0;
		// todo[high] try catch JSON.parse
		this.inputSets = JSON.parse(localStorage.getItem('input-sets')) || [{name: timestamp()}];
		this.sharedWeightEntries = JSON.parse(localStorage.getItem('shared-weight-entries')) || [];

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
			apiConstants.items,
			this.$('#loaded-items-status'));

		this.$('#league-input').addEventListener('change', () => this.store());
		this.$('#session-id-input').addEventListener('change', () => this.store());

		this.$('#refresh-button').addEventListener('click', () => window.location.reload());

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
		this.$('#input-import-trade-search-url').addEventListener('import-url', async e => {
			let apiQueryParams =
				await TradeQuery.fromApiHtmlUrl(this.$('#session-id-input').value, e.detail);
			let unifiedQueryParams = await UnifiedQueryParams.fromApiQueryParams(apiQueryParams);
			this.addInputSet(`imported from URL ${timestamp()}`, unifiedQueryParams);
		});

		this.$('#input-import-trade-search-url').addEventListener('import-item-text', async e => {
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

		document.addEventListener('keydown', e => {
			if (e.key === 'Enter' && e.ctrlKey)
				this.emit('submit', {add: e.shiftKey});
			if (e.key === 'r' && e.ctrlKey)
				window.location.reload();
		});
		this.$('#search-button').addEventListener('click', e =>
			this.emit('submit', {add: e.ctrlKey}));
		this.$('#cancel-button').addEventListener('click', () => this.emit('cancel'));
		this.$('#search-in-browser-button').addEventListener('click', async () =>
			shell.openExternal(await (await this.finalizeTradeQuery())[0].toApiHtmlUrl()));

		this.inputSets.forEach(inputSet => {
			let inputSetEl = this.addInputSetEl();
			inputSetEl.name = inputSet.name;
		});
		this.setInputSetIndex(this.inputSetIndex);

		// todo[high] replace this with explicit calls when inputs change
		setInterval(() => this.finalizeTradeQuery(), 1000);
	}

	updateStatusIndicator(promise, element, league) {
		element.classList.add('busy');
		element.classList.remove('valid', 'invalid');
		promise
			.then(() => {
				if (!league || league === configForRenderer.config.league)
					element.classList.add('valid');
			})
			.catch(() => {
				if (!league || league === configForRenderer.config.league)
					element.classList.add('invalid');
			});
	}

	onConfigChange(config) {
		this.$('#league-input').value = config.league;
		this.$('#loaded-currencies-status').classList.remove('valid', 'invalid');
		this.updateStatusIndicator(
			apiConstants.currencyPrices(config.league),
			this.$('#loaded-currencies-status'),
			config.league,
		);
	}

	addInputSet(name, unifiedQueryParams) {
		this.inputSets.push({
			name,
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
		this.$('#input-trade-params').setUnifiedQueryParams(unifiedQueryParams);
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

	async finalizeTradeQuery() {
		let currencyPrices = await apiConstants.currencyPrices(
			configForRenderer.config.league);
		let manual6LinkOptions = [
			['fuse6LinkBenchCraft', currencyPrices.fuse6LinkBenchCraft],
			['theBlackMorrigan6LinkBeastCraft', currencyPrices.theBlackMorrigan6LinkBeastCraft],
		];
		let manual6LinkCheapestOption = manual6LinkOptions[
			minIndex(manual6LinkOptions.map(v => v[1]))];

		let league = this.$('#league-input').value;
		let sessionId = this.$('#session-id-input').value;
		let tradeQueries = await Promise.all(this.inputSets
			.filter(inputSet => inputSet.active)
			.flatMap(inputSet =>
				UnifiedQueryParams
					.fromStorageQueryParams(inputSet.unifiedQueryParams, this.sharedWeightEntries)
					.toTradeQueryData(manual6LinkCheapestOption[0], manual6LinkCheapestOption[1])
					.map(async data => new TradeQuery((await data), league, sessionId,
						(await data).affixValueShift, (await data).priceShifts))));

		// todo[medium] move this to InputTradeParams and remove import button, instead
		//  automatically update url <-> form when either one changes
		this.$('#input-import-trade-search-url').url = tradeQueries[0].toApiHtmlUrl;

		return tradeQueries;
	}
});

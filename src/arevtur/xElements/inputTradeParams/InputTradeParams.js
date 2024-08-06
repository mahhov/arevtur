const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const ApiConstants = require('../../ApiConstants');
const UnifiedQueryParams = require('../../UnifiedQueryParams');
const {
	defensePropertyTuples,
	defenseBuildValueTuples,
	affixPropertyTuples,
	influenceProperties,
} = require('./Properties');
const pobApi = require('../../../pobApi/pobApi');
const Searcher = require('../../Searcher');

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {
			name: {},
			type: {},
			minValue: {},
			price: {},
			offline: {boolean: true},
			armour: {},
			evasion: {},
			energyShield: {},
			armourBuildValue: {},
			evasionBuildValue: {},
			energyShieldBuildValue: {},
			armourBuildValueTooltip: {},
			evasionBuildValueTooltip: {},
			energyShieldBuildValueTooltip: {},
			prefix: {},
			suffix: {},
			linked: {boolean: true},
			uncorrupted: {boolean: true},
			nonUnique: {boolean: true},
			/* influences array */
		};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		ApiConstants.constants.itemTexts().then(itemTexts =>
			this.$('#name-input').autocompletes = itemTexts);
		this.$('#name-input').addEventListener('change', () => {
			this.name = this.$('#name-input').value;
			this.updateQueryParams();
		});
		ApiConstants.constants.typeTexts().then(typeTexts =>
			this.$('#type-input').autocompletes = typeTexts);
		this.$('#type-input').addEventListener('change', () => {
			this.type = this.$('#type-input').value;
			this.updateQueryParams();
			this.refreshBuild(false);
		});
		this.$('#min-value-input').addEventListener('change', () => {
			this.minValue = this.$('#min-value-input').value;
			this.updateQueryParams();
		});
		this.$('#price-input').addEventListener('change', () => {
			this.price = this.$('#price-input').value;
			this.updateQueryParams();
		});
		this.$('#offline-check').addEventListener('change', () => {
			this.offline = this.$('#offline-check').checked;
			this.updateQueryParams();
		});
		// todo slow async stuff probably breaks stuff if the user interacts with the UI before the
		//  query returns.
		this.$('#build-import-for-type-button').addEventListener('click', async () => {
			try {
				let modWeightsString = await pobApi.generateQuery(this.type, this.price);
				let modWeights = JSON.parse(modWeightsString);
				let unifiedQueryParams = UnifiedQueryParams.fromModWeights(
					await UnifiedQueryParams.fromInputTradeQueryParams(this), modWeights);
				await this.loadQueryParams(unifiedQueryParams);
				this.updateQueryParams();
			} catch (e) {
			}
		});
		[...defensePropertyTuples, ...affixPropertyTuples]
			.forEach(([property, query]) => {
				this.$(query).addEventListener('change', () => {
					this[property] = this.$(query).value;
					this.updateQueryParams();
				});
			});
		defenseBuildValueTuples
			.forEach(([buildValue, query, property]) => {
				this.$(query).addEventListener('click', () => {
					this[property] = this[buildValue];
					this.updateQueryParams();
				});
			});
		this.$('#linked-check').addEventListener('change', () => {
			this.linked = this.$('#linked-check').checked;
			this.updateQueryParams();
		});
		this.$('#uncorrupted-check').addEventListener('change', () => {
			this.uncorrupted = this.$('#uncorrupted-check').checked;
			this.updateQueryParams();
		});
		this.$('#non-unique-check').addEventListener('change', () => {
			this.nonUnique = this.$('#non-unique-check').checked;
			this.updateQueryParams();
		});
		this.$('#influence-input').autocompletes = influenceProperties;
		this.$('#influence-input').addEventListener('change', () => {
			this.influences = this.$('#influence-input').valuesAsArray;
			this.updateQueryParams();
		});
		document.addEventListener('keydown', e => {
			if (e.key === 'g' && e.ctrlKey)
				this.$('#search-input').focus();
		});
		this.$('#search-input').addEventListener('input', () => this.applySearch());
		this.$('#query-properties-list').addEventListener('arrange', () => {
			this.checkProperties();
			this.updateQueryParams();
		});
		this.$('#add-property-button').addEventListener('click', () => this.addQueryProperty());
		this.tradeQueryParams = {};

		pobApi.addListener('change', () => this.refreshBuild());
	}

	set name(value) {
		this.$('#name-input').value = value;
	}

	set type(value) {
		this.$('#type-input').value = value;
		this.refreshBuild();
	}

	set minValue(value) {
		this.$('#min-value-input').value = value;
	}

	set price(value) {
		this.$('#price-input').value = value;
	}

	set offline(value) {
		this.$('#offline-check').checked = value;
	}

	set armour(value) {
		this.$('#armour-input').value = value;
	}

	set evasion(value) {
		this.$('#evasion-input').value = value;
	}

	set energyShield(value) {
		this.$('#energy-shield-input').value = value;
	}

	set armourBuildValue(value) {
		this.$('#armour-build-value').text = value;
	}

	set evasionBuildValue(value) {
		this.$('#evasion-build-value').text = value;
	}

	set energyShieldBuildValue(value) {
		this.$('#energy-shield-build-value').text = value;
	}

	set armourBuildValueTooltip(value) {
		this.$('#armour-build-value').tooltip = value;
	}

	set evasionBuildValueTooltip(value) {
		this.$('#evasion-build-value').tooltip = value;
	}

	set energyShieldBuildValueTooltip(value) {
		this.$('#energy-shield-build-value').tooltip = value;
	}

	set prefix(value) {
		this.$('#prefix-input').value = value;
	}

	set suffix(value) {
		this.$('#suffix-input').value = value;
	}

	set linked(value) {
		this.$('#linked-check').checked = value;
	}

	set uncorrupted(value) {
		this.$('#uncorrupted-check').checked = value;
	}

	set nonUnique(value) {
		this.$('#non-unique-check').checked = value;
	}

	get influences() {
		return this.influences_;
	}

	set influences(value) {
		this.influences_ = value;
		this.$('#influence-input').valuesAsArray = value;
	}

	addQueryProperty() {
		let queryProperty = document.createElement('x-query-property');
		queryProperty.type = this.type;
		ApiConstants.constants.propertyTexts()
			.then(propertyTexts => queryProperty.properties = propertyTexts);
		queryProperty.slot = 'list';
		this.$('#query-properties-list').appendChild(queryProperty);
		queryProperty.addEventListener('change', () => {
			this.propagateLockedWeights(queryProperty);
			this.checkProperties();
			this.applySearch();
			this.updateQueryParams();
		});
		queryProperty.addEventListener('lock-change', () => {
			if (!queryProperty.locked)
				return;
			if (!queryProperty.previousSibling)
				return queryProperty.locked = false;
			queryProperty.weight = queryProperty.previousSibling.weight;
			this.propagateLockedWeights(queryProperty);
			this.checkProperties();
			this.applySearch();
			this.updateQueryParams();
		});
		queryProperty.addEventListener('share-change', () => {
			this.checkProperties();
			this.applySearch();
			this.updateQueryParams();
		});
		queryProperty.addEventListener('remove', () => {
			queryProperty.remove();
			this.updateQueryParams();
		});
		return queryProperty;
	};

	propagateLockedWeights(queryProperty) {
		let next = queryProperty.nextSibling;
		while (next && next.locked) {
			next.weight = queryProperty.weight;
			next = next.nextSibling;
		}
	}

	checkProperties() {
		let queryProperties = this.$$('#query-properties-list x-query-property');

		// check locked checkboxes
		queryProperties.forEach(queryProperty =>
			queryProperty.locked = queryProperty.locked && queryProperty.previousSibling &&
				queryProperty.weight === queryProperty.previousSibling.weight &&
				queryProperty.filter === queryProperty.previousSibling.filter &&
				queryProperty.filter !== 'not');

		// check shared checkboxes
		queryProperties.forEach(queryProperty =>
			queryProperty.shared = queryProperty.shared && queryProperty.filter === 'weight');

		// check if last input is empty
		if (this.$('#query-properties-list').lastChild.property)
			this.addQueryProperty();
	}

	applySearch() {
		let searcher = new Searcher(this.$('#search-input').value, false);
		[...this.$('#query-properties-list').children].forEach(queryProperty => {
			let match = this.$('#search-input').value && searcher.test([queryProperty.property]);
			queryProperty.classList.toggle('search-highlighted', match);
		});
	}

	async loadQueryParams(tradeQueryParams) {
		await tradeQueryParams.toInputTradeQueryParams(this);
		this.addQueryProperty();
		this.tradeQueryParams = tradeQueryParams;
		this.sharedWeightEntries = tradeQueryParams.sharedWeightEntries;
	}

	async updateQueryParams() {
		this.tradeQueryParams = await UnifiedQueryParams.fromInputTradeQueryParams(this);
		this.sharedWeightEntries = this.tradeQueryParams.sharedWeightEntries;
		this.emit('change');
	}

	refreshBuild(propagate = true) {
		if (propagate)
			this.$$('#query-properties-list x-query-property')
				.forEach(queryProperty => queryProperty.type = this.type);
		defenseBuildValueTuples.forEach(async ([buildValue, _, __, modProperty]) => {
			try {
				let summary = await pobApi.evalItemModSummary(this.type, modProperty, 200);
				this[buildValue] = summary.value;
				this[buildValue + 'Tooltip'] = summary.text;
			} catch (e) {
			}
		});
	}
});

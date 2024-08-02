const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const ApiConstants = require('../../ApiConstants');
const UnifiedQueryParams = require('../../UnifiedQueryParams');
const {defensePropertyTuples, defenseBuildValueTuples, affixPropertyTuples, influenceProperties} = require('./Properties');

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
		this.$('#name-input').freeForm = true;
		this.$('#name-input').addEventListener('change', () => {
			this.name = this.$('#name-input').value;
			this.updateQueryParams();
		});
		ApiConstants.constants.typeTexts().then(typeTexts =>
			this.$('#type-input').autocompletes = typeTexts);
		this.$('#type-input').addEventListener('change', () => {
			this.type = this.$('#type-input').value;
			this.updateQueryParams();
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
		this.$('#pob-import-button').addEventListener('click', async () => {
			if (!this.lastPobApi)
				return;
			let queryString = await this.lastPobApi.generateQuery(this.type, this.price);
			let query = JSON.parse(queryString);
			let unifiedQueryParams = UnifiedQueryParams.fromApiQueryParams(query);
			await this.loadQueryParams(unifiedQueryParams);
			this.updateQueryParams();
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
		this.$('#query-properties-list').addEventListener('arrange', () => {
			this.checkProperties();
			this.updateQueryParams();
		});
		this.$('#query-properties-list').addEventListener('keydown', e => {
			if (e.key === 'Enter' && e.shiftKey)
				this.$('#query-properties-list > :focus-within + x-query-property').focus();
		});
		this.$('#add-property-button').addEventListener('click', () => this.addQueryProperty());
		this.queryParams = {};
	}

	set name(value) {
		this.$('#name-input').value = value;
	}

	set type(value) {
		this.$('#type-input').value = value;
		this.$$('#query-properties-list x-query-property').forEach(queryProperty =>
			queryProperty.type = value);
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
		this.$('#armour-build-value-button').textContent = value;
	}

	set evasionBuildValue(value) {
		this.$('#evasion-build-value-button').textContent = value;
	}

	set energyShieldBuildValue(value) {
		this.$('#energy-shield-build-value-button').textContent = value;
	}

	set armourBuildValueTooltip(value) {
		this.$('#armour-build-value-tooltip').text = value;
	}

	set evasionBuildValueTooltip(value) {
		this.$('#evasion-build-value-tooltip').text = value;
	}

	set energyShieldBuildValueTooltip(value) {
		this.$('#energy-shield-build-value-tooltip').text = value;
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

	async loadQueryParams(queryParams) {
		await queryParams.toInputTradeQueryParams(this);
		this.addQueryProperty();
		this.queryParams = queryParams;
		this.sharedWeightEntries = queryParams.sharedWeightEntries;
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

	propagateLockedWeights(queryProperty) {
		let next = queryProperty.nextSibling;
		while (next && next.locked) {
			next.weight = queryProperty.weight;
			next = next.nextSibling;
		}
	}

	addQueryProperty() {
		let queryProperty = document.createElement('x-query-property');
		queryProperty.type = this.type;
		ApiConstants.constants.propertyTexts().then(propertyTexts => queryProperty.properties = propertyTexts);
		queryProperty.slot = 'list';
		this.$('#query-properties-list').appendChild(queryProperty);
		queryProperty.addEventListener('change', () => {
			this.propagateLockedWeights(queryProperty);
			this.checkProperties();
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
			this.updateQueryParams();
		});
		queryProperty.addEventListener('share-change', () => {
			this.checkProperties();
			this.updateQueryParams();
		});
		queryProperty.addEventListener('remove', () => {
			queryProperty.remove();
			this.updateQueryParams();
		});
		queryProperty.refreshBuild(this.lastPobApi);
		return queryProperty;
	};

	async updateQueryParams() {
		this.queryParams = await UnifiedQueryParams.fromInputTradeQueryParams(this);
		this.sharedWeightEntries = this.queryParams.sharedWeightEntries;
		this.emit('change');
	}

	refreshBuild(pobApi = this.lastPobApi) {
		this.lastPobApi = pobApi;
		this.$$('#query-properties-list x-query-property')
			.forEach(queryProperty => queryProperty.refreshBuild(pobApi));
		if (!pobApi)
			return;
		defenseBuildValueTuples.forEach(async ([buildValue, _, __, modProperty]) => {
			let summary = await pobApi.evalItemModSummary(this.type, modProperty, 200);
			this[buildValue] = summary.value;
			this[buildValue + 'Tooltip'] = summary.text;
		});
	}
});

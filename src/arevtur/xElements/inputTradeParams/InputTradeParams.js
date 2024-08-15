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
			this.emit('change');
		});
		ApiConstants.constants.typeTexts().then(typeTexts =>
			this.$('#type-input').autocompletes = typeTexts);
		this.$('#type-input').addEventListener('change', () => {
			this.type = this.$('#type-input').value;
			this.emit('change');
		});
		this.$('#min-value-input').addEventListener('change', () => {
			this.minValue = this.$('#min-value-input').value;
			this.emit('change');
		});
		this.$('#price-input').addEventListener('change', (e) => {
			this.price = this.$('#price-input').value;
			this.emit('change');
		});
		this.$('#offline-check').addEventListener('change', () => {
			this.offline = this.$('#offline-check').checked;
			this.emit('change');
		});
		// todo[high] slow async stuff probably breaks stuff if the user interacts with the UI
		//  before the query returns.
		this.$('#build-import-for-type-button').addEventListener('click', async () => {
			try {
				let modWeights = await pobApi.getModWeights(this.type, !this.uncorrupted);
				let unifiedQueryParams = UnifiedQueryParams.fromModWeights(
					await this.unifiedQueryParams, modWeights);
				await this.loadQueryParams(unifiedQueryParams);
			} catch (e) {
			}
		});
		[...defensePropertyTuples, ...affixPropertyTuples]
			.forEach(([property, query]) => {
				this.$(query).addEventListener('change', () => {
					this[property] = this.$(query).value;
					this.emit('change');
				});
			});
		defenseBuildValueTuples
			.forEach(([buildValue, query, property]) => {
				this.$(query).addEventListener('click', () => {
					this[property] = this[buildValue];
					this.emit('change');
				});
			});
		this.$('#linked-check').addEventListener('change', () => {
			this.linked = this.$('#linked-check').checked;
			this.emit('change');
		});
		this.$('#uncorrupted-check').addEventListener('change', () => {
			this.uncorrupted = this.$('#uncorrupted-check').checked;
			this.emit('change');
		});
		this.$('#non-unique-check').addEventListener('change', () => {
			this.nonUnique = this.$('#non-unique-check').checked;
			this.emit('change');
		});
		this.$('#influence-input').autocompletes = influenceProperties;
		this.$('#influence-input').addEventListener('change', () => {
			this.influences = this.$('#influence-input').valuesAsArray;
			this.emit('change');
		});
		document.addEventListener('keydown', e => {
			// todo[high] ctrl+f & g should select search text so it can be replaced easily
			if (e.key === 'g' && e.ctrlKey)
				this.$('#search-input').focus();
		});
		this.$('#search-input').addEventListener('input', () => this.applySearch());
		this.$('#drop-implicit-mods-button').addEventListener('click', () => {
			[...this.$('#query-properties-list').children].forEach(queryProperty => {
				if (queryProperty.property.includes('(implicit)'))
					queryProperty.remove();
			});
		});
		// todo[high] merge attributes
		this.$('#merge-resist-mods-button').addEventListener('click', () => {
			let maxWeight = 0;
			[...this.$('#query-properties-list').children].forEach(queryProperty => {
				// todo[high] not very robust regex
				if (queryProperty.property.match(/\+#% to .* resistances? \(explicit\)/i)) {
					// todo[high] max is incorrect when removing a mod with multiple resists
					maxWeight = Math.max(queryProperty.weight, maxWeight);
					queryProperty.remove();
				}
			});
			if (maxWeight) {
				let queryProperty = this.addQueryProperty();
				queryProperty.property = '+#% total Resistance (pseudo)';
				queryProperty.weight = maxWeight;
			}
			this.propagateLockedWeights();
			this.checkProperties(); // todo[medium] remove null 0 properties
			this.applySearch();
			this.emit('change');
		});
		this.$('#enable-all-mods-button').addEventListener('click', () => {
			[...this.$('#query-properties-list').children].forEach(
				queryProperty => queryProperty.enabled = true);
			this.checkProperties();
			this.emit('change');
		});
		this.$('#query-properties-list').addEventListener('arrange', () => {
			this.checkProperties();
			this.emit('change');
		});

		pobApi.addListener('change', () => this.refreshBuild());
	}

	set name(value) {
		this.$('#name-input').value = value;
	}

	set type(value) {
		this.$('#type-input').value = value;
		this.$$('#query-properties-list x-query-property')
			.forEach(queryProperty => queryProperty.type = this.type);
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
		queryProperty.enabled = true;
		queryProperty.slot = 'list';
		this.$('#query-properties-list').appendChild(queryProperty);
		queryProperty.addEventListener('change', () => {
			this.propagateLockedWeights();
			this.checkProperties();
			this.applySearch();
			this.emit('change');
		});
		queryProperty.addEventListener('lock-change', () => {
			if (!queryProperty.locked)
				return;
			if (!queryProperty.previousSibling)
				return queryProperty.locked = false;
			queryProperty.weight = queryProperty.previousSibling.weight;
			this.propagateLockedWeights();
			this.checkProperties();
			this.emit('change');
		});
		queryProperty.addEventListener('share-change', () => {
			this.checkProperties();
			this.emit('change');
		});
		queryProperty.addEventListener('enable-change', () => {
			this.checkProperties();
			this.emit('change');
		});
		queryProperty.addEventListener('remove', () => {
			queryProperty.remove();
			this.emit('change');
		});
		return queryProperty;
	};

	propagateLockedWeights() {
		// todo[medium] locked isn't working
		let queryProperties = this.$$('#query-properties-list x-query-property');
		queryProperties.forEach((queryProperty, i, a) => {
			if (queryProperty.locked && i < a.length)
				a[i + 1].weight = queryProperty.weight;
		});
	}

	checkProperties() {
		let queryProperties = [...this.$$('#query-properties-list x-query-property')];

		// check locked checkboxes
		queryProperties.forEach(queryProperty =>
			queryProperty.locked = queryProperty.locked && queryProperty.previousSibling &&
				queryProperty.weight === queryProperty.previousSibling.weight &&
				queryProperty.filter === queryProperty.previousSibling.filter &&
				queryProperty.filter !== 'not');

		// check shared checkboxes
		queryProperties.forEach(queryProperty =>
			queryProperty.shared = queryProperty.shared && queryProperty.filter === 'weight');

		// check enabled checkboxes
		queryProperties
			.filter(queryProperty => queryProperty.enabled)
			.slice(35)
			.forEach(queryProperty => queryProperty.enabled = false);

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

	async loadQueryParams(unifiedQueryParams) {
		await unifiedQueryParams.toInputTradeQueryParams(this);
		this.addQueryProperty();
		this.propagateLockedWeights();
		this.checkProperties();
		this.applySearch();
		this.emit('change');
	}

	get unifiedQueryParams() {
		return UnifiedQueryParams.fromInputTradeQueryParams(this);
	}

	refreshBuild() {
		defenseBuildValueTuples.forEach(async ([buildValue, _, __, modProperty]) => {
			try {
				this[buildValue] = 0;
				this[buildValue + 'Tooltip'] = '';
				let summary = await pobApi.evalItemModSummary(this.type, modProperty, 400);
				this[buildValue] = summary.value;
				this[buildValue + 'Tooltip'] = summary.text;
			} catch (e) {
			}
		});
	}
});

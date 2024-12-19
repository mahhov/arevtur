const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const apiConstants = require('../../apiConstants');
const UnifiedQueryParams = require('../../UnifiedQueryParams');
const {
	defensePropertyTuples,
	defenseBuildValueTuples,
	maxRequirementPropertyTuples,
	affixPropertyTuples,
	influenceProperties,
} = require('./Properties');
const pobApi = require('../../../services/pobApi/pobApi');
const Searcher = require('../../../util/Searcher');
const Macros = require('../../Macros');

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
			maxLevelRequirement: {},
			maxStrengthRequirement: {},
			maxDexterityRequirement: {},
			maxIntelligenceRequirement: {},
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
		apiConstants.items.then(items =>
			this.$('#name-input').autocompletes = items);
		this.$('#name-input').addEventListener('change', () => {
			this.name = this.$('#name-input').value;
			this.emit('change');
		});

		apiConstants.typeTexts().then(typeTexts =>
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
		this.$('#smart-build-import-for-type-button').addEventListener('click', async () => {
			this.setUnifiedQueryParams(await this.buildImport()
				.then(Macros.Input.replaceResists)
				.then(Macros.Input.replaceAttributes)
				.then(Macros.Input.addPseudo)
				.then(Macros.Input.enableAll));
		});
		this.$('#build-import-for-type-button').addEventListener('click', async () => {
			try {
				this.setUnifiedQueryParams(await this.buildImport());
			} catch (e) {
				// buildImport logs errors, no need to handle it again
			}
		});

		[...defensePropertyTuples, ...maxRequirementPropertyTuples, ...affixPropertyTuples]
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
			if (e.key === 'g' && e.ctrlKey)
				this.$('#search-input').select();
		});
		this.$('#search-input').addEventListener('input', () => this.applySearch());
		this.$('#drop-implicit-mods-button').addEventListener('click', async () =>
			this.setUnifiedQueryParams(
				await Macros.Input.dropImplicits(this.unifiedQueryParams)));
		this.$('#replace-resist-mods-button').addEventListener('click', async () =>
			this.setUnifiedQueryParams(
				await Macros.Input.replaceResists(this.unifiedQueryParams)));
		this.$('#replace-attribute-mods-button').addEventListener('click', async () =>
			this.setUnifiedQueryParams(
				await Macros.Input.replaceAttributes(this.unifiedQueryParams)));
		this.$('#add-crafted-mods-button').addEventListener('click', async () =>
			this.setUnifiedQueryParams(
				await Macros.Input.addCrafted(this.unifiedQueryParams)));
		this.$('#add-pseudo-mods-button').addEventListener('click', async () =>
			this.setUnifiedQueryParams(
				await Macros.Input.addPseudo(this.unifiedQueryParams)));
		this.$('#enable-all-mods-button').addEventListener('click', async () =>
			this.setUnifiedQueryParams(Macros.Input.enableAll(this.unifiedQueryParams)));

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
		this.queryProperties.forEach(queryProperty => queryProperty.type = this.type);
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

	set maxLevelRequirement(value) {
		this.$('#max-level-requirement-input').value = value;
	}

	set maxStrengthRequirement(value) {
		this.$('#max-strength-requirement-input').value = value;
	}

	set maxDexterityRequirement(value) {
		this.$('#max-dexterity-requirement-input').value = value;
	}

	set maxIntelligenceRequirement(value) {
		this.$('#max-intelligence-requirement-input').value = value;
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

	get queryProperties() {
		return this.$$('#query-properties-list x-query-property');
	}

	async buildImport() {
		try {
			let pobType = await apiConstants.typeToPobType(this.type);
			let {minValue, modWeights} = await pobApi.getModWeights(pobType, !this.uncorrupted);
			return await UnifiedQueryParams.fromModWeights(this.unifiedQueryParams, minValue,
				modWeights);
		} catch (e) {
			console.warn('PoB import', e);
			return Promise.reject();
		}
	}

	addQueryProperty() {
		let queryProperty = document.createElement('x-query-property');
		queryProperty.type = this.type;
		apiConstants.propertyTexts()
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
	}

	propagateLockedWeights() {
		this.queryProperties.forEach((queryProperty, i, a) => {
			if (queryProperty.locked && i)
				queryProperty.weight = a[i - 1].weight;
		});
	}

	checkProperties() {
		let queryProperties = [...this.queryProperties];

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
		let searcher = new Searcher(this.$('#search-input').value);
		this.queryProperties.forEach(queryProperty => {
			let match = this.$('#search-input').value && searcher.test(queryProperty.property);
			queryProperty.classList.toggle('search-highlighted', match);
		});
	}

	get unifiedQueryParams() {
		return UnifiedQueryParams.fromInputTradeQueryParams(this);
	}

	async setUnifiedQueryParams(unifiedQueryParams, external = false) {
		await unifiedQueryParams.toInputTradeQueryParams(this);
		this.addQueryProperty();
		this.propagateLockedWeights();
		this.checkProperties();
		this.applySearch();
		if (!external)
			this.emit('change');
	}

	refreshBuild() {
		this.queryProperties.forEach(queryProperty => queryProperty.refreshBuild());
		defenseBuildValueTuples.forEach(async ([buildValue, _, __, modProperty]) => {
			try {
				this[buildValue] = 0;
				this[buildValue + 'Tooltip'] = '';
				let pobType = await apiConstants.typeToPobType(this.type);
				let summary = await pobApi.evalItemModSummary(pobType, modProperty, 400);
				this[buildValue] = summary.value;
				this[buildValue + 'Tooltip'] = summary.text;
			} catch (e) {
				console.warn('Refresh defense build values', e);
			}
		});
	}
});

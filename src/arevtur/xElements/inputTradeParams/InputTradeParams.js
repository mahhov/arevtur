const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const ApiConstants = require('../../ApiConstants');

const defensePropertyTuples = [
	['armour', '#armour-input'],
	['evasion', '#evasion-input'],
	['energyShield', '#energy-shield-input'],
];

const affixPropertyTuples = [
	['prefix', '#prefix-input'],
	['suffix', '#suffix-input'],
];

const influenceProperties = [
	'hunter',
	'crusader',
	'shaper',
	'elder',
	'redeemer',
	'warlord',
];

const queryPropertyFilters = [
	// queryParamsKey, queryPropertyFilter, hasWeight
	['weightEntries', 'weight', true],
	['andEntries', 'and', true],
	['notEntries', 'not'],
	['conditionalPrefixEntries', 'conditional prefix', true],
	['conditionalSuffixEntries', 'conditional suffix', true],
]

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
		[...defensePropertyTuples, ...affixPropertyTuples]
			.forEach(([property, query]) => {
				this.$(query).addEventListener('change', () => {
					this[property] = this.$(query).value;
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

	async loadQueryParams(queryParams = {}, sharedWeightEntries) {
		this.name = queryParams.name || '';
		this.type = await ApiConstants.constants.typeIdToText(queryParams.type) || '';
		this.minValue = queryParams.minValue || 0;
		this.price = queryParams.maxPrice || 1;
		this.offline = queryParams.offline || false;
		let defenseProperties = queryParams.defenseProperties || {};
		defensePropertyTuples.forEach(([property]) => {
			let defenseProperty = defenseProperties[property];
			this[property] = defenseProperty ? defenseProperty.weight : 0;
		});
		let affixProperties = queryParams.affixProperties || {};
		affixPropertyTuples.forEach(([property]) =>
			this[property] = affixProperties[property] || 0);
		this.linked = queryParams.linked || false;
		this.uncorrupted = queryParams.uncorrupted || false;
		this.nonUnique = queryParams.nonUnique || false;
		this.influences = queryParams.influences ? influenceProperties.map(influence => queryParams.influences.includes(influence)) : [];
		XElement.clearChildren(this.$('#query-properties-list'));
		sharedWeightEntries
			.forEach(async ([property, weight, locked]) => {
				let queryProperty = this.addQueryProperty();
				queryProperty.property = await ApiConstants.constants.propertyIdToText(property);
				queryProperty.weight = weight;
				queryProperty.filter = 'weight';
				queryProperty.locked = locked;
				queryProperty.shared = true;
			});

		queryPropertyFilters.forEach(([key, filter, hasWeight]) => {
			if (queryParams[key])
				queryParams[key]
					.forEach(async ([property, weight, locked]) => {
						let queryProperty = this.addQueryProperty();
						queryProperty.property = await ApiConstants.constants.propertyIdToText(property);
						queryProperty.filter = filter;
						if (hasWeight) {
							queryProperty.weight = weight;
							queryProperty.locked = locked;
						}
					});
		});

		this.addQueryProperty();
		this.queryParams = queryParams;
		this.sharedWeightEntries = sharedWeightEntries;
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
		ApiConstants.constants.propertyTexts().then(propertyTexts =>
			queryProperty.properties = propertyTexts);
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
		return queryProperty;
	};

	async updateQueryParams() {
		let type = await ApiConstants.constants.typeTextToId(this.type);

		let defenseProperties = Object.fromEntries(defensePropertyTuples
			.map(([property]) => [property, {
				weight: Number(this[property]),
				min: 0,
			}]));

		let affixProperties = Object.fromEntries(affixPropertyTuples
			.map(([property]) => [property, Number(this[property])]));

		let propertyEntries = (await Promise.all([...this.$$('#query-properties-list x-query-property')]
			.map(async queryProperty => ({
				propertyId: await ApiConstants.constants.propertyTextToId(queryProperty.property),
				weight: Number(queryProperty.weight),
				filter: queryProperty.filter,
				locked: queryProperty.locked,
				shared: queryProperty.shared,
			})))).filter(({propertyId}) => propertyId);

		// todo make shared entries more similar to unshared entries so that they can be processed similarly
		let sharedWeightEntries = propertyEntries
			.filter(entry => entry.filter === 'weight' && entry.weight && entry.shared)
			.map(entry => [entry.propertyId, entry.weight, entry.locked]);
		let unsharedEntries = Object.fromEntries(
			queryPropertyFilters.map(([key, filter, hasWeight]) => {
				let entries = propertyEntries
					.filter(entry => entry.filter === filter && (entry.weight || !hasWeight) && !entry.shared)
					.map(entry => hasWeight ? [entry.propertyId, entry.weight, entry.locked] : [entry.propertyId]);
				return [key, entries];
			}));

		this.queryParams = {
			name: this.name,
			type,
			minValue: Number(this.minValue),
			maxPrice: Number(this.price),
			offline: this.offline,
			defenseProperties,
			affixProperties,
			linked: this.linked,
			uncorrupted: this.uncorrupted,
			nonUnique: this.nonUnique,
			influences: influenceProperties.filter((_, i) => this.influences[i]),
			...unsharedEntries,
		};
		this.sharedWeightEntries = sharedWeightEntries;

		this.emit('change');
	}

	refreshBuild(itemEval) {
		this.$$('#query-properties-list x-query-property')
			.forEach(queryProperty => queryProperty.refreshBuild(itemEval));
	}
});

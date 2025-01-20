const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const pobApi = require('../../../services/pobApi/pobApi');
const UnifiedQueryParams = require('../../UnifiedQueryParams');
const apiConstants = require('../../apiConstants');
const {round} = require('../../../util/util');

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {
			type: {},
			property: {},
			weight: {},
			filter: {},
			locked: {boolean: true},
			shared: {boolean: true},
			enabled: {boolean: true},
			buildValue: {},
			buildValueTooltip: {},
		};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		if (this.draggable)
			return;
		this.$('#container').addEventListener('keyup', e => {
			if (e.key === 'Enter' && !e.shiftKey)
				this.$('#container > :focus-within + *').focus();
		});
		this.$('#property').addEventListener('change', () => {
			this.property = this.$('#property').value;
			this.emit('change');
		});
		this.$('#weight').addEventListener('change', () => {
			this.weight = this.$('#weight').value;
			this.emit('change');
		});
		this.$('#filter').autocompletes =
			['weight', 'and', 'not', 'conditional prefix', 'conditional suffix'];
		this.$('#filter').addEventListener('change', () => {
			this.filter = this.$('#filter').value;
			this.emit('change');
		});
		this.$('#locked').addEventListener('change', () => {
			this.locked = this.$('#locked').checked;
			this.emit('lock-change');
		});
		this.$('#shared').addEventListener('change', () => {
			this.shared = this.$('#shared').checked;
			this.emit('share-change');
		});
		this.$('#enabled').addEventListener('change', () => {
			this.enabled = this.$('#enabled').checked;
			this.emit('enable-change');
		});
		this.$('#remove').addEventListener('click', () => this.emit('remove'));
		this.$('#build-value').addEventListener('click', () => {
			this.weight = this.buildValue;
			this.emit('change');
		});
		this.property ||= '';
		this.weight ||= 0;
		this.filter ||= 'weight';
	}

	set type(value) {
		this.refreshBuild();
	}

	set properties(value) {
		this.$('#property').autocompletes = value;
	}

	set property(value) {
		this.$('#property').value = value;
		this.refreshBuild();
	}

	set weight(value) {
		this.$('#weight').value = value;
	}

	set filter(value) {
		this.$('#filter').value = value;
	}

	set locked(value) {
		this.$('#locked').checked = value;
	}

	set shared(value) {
		this.$('#shared').checked = value;
	}

	set enabled(value) {
		this.$('#enabled').checked = value;
	}

	set buildValue(value) {
		this.$('#build-value').text = value && round(Number(value), 3) || '';
	}

	set buildValueTooltip(value) {
		this.$('#build-value').tooltip = value;
	}

	focus() {
		this.$('#property').focus();
	}

	async refreshBuild() {
		try {
			this.buildValue = 0;
			this.buildValueTooltip = '';
			let pobType = await apiConstants.typeToPobType(this.type);
			let summary = await pobApi.evalItemModSummary(pobType, this.property, 100);
			this.buildValue = summary.value;
			this.buildValueTooltip = summary.text;

			// this.buildValue = '';
			// let pobType = await apiConstants.typeToPobType(this.type);
			// let {modWeights} = await pobApi.getModWeights(pobType);
			// let unifiedQueryParams = await UnifiedQueryParams.fromModWeights(
			// 	new UnifiedQueryParams(), 0, modWeights);
			// this.buildValue = unifiedQueryParams.weightEntries
			// 	.find(entry => entry.propertyText === this.property)
			// 	?.weight;
		} catch (e) {
			// console.warn('Refresh query property build values', e);
		}
	}
});

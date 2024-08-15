const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const pobApi = require('../../../pobApi/pobApi');
const UnifiedQueryParams = require('../../UnifiedQueryParams');
const ApiConstants = require('../../ApiConstants');

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
		this.$('#weight').addEventListener('input', () => {
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
		this.property = this.property || '';
		this.weight = this.weight || 0;
		this.filter = this.filter || 'weight';

		pobApi.addListener('change', () => this.refreshBuild());
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
		this.$('#build-value').text = value && Math.round(Number(value) * 1000) / 1000;
	}

	focus() {
		this.$('#property').focus();
	}

	async refreshBuild() {
		try {
			this.buildValue = '';
			let modWeights = await pobApi.getModWeights(this.type);
			let unifiedQueryParams = UnifiedQueryParams.fromModWeights({}, modWeights);
			let propertyId = await ApiConstants.constants.propertyTextToId(this.property);
			this.buildValue =
				unifiedQueryParams.weightEntries.find(entry => entry[0] === propertyId)[1];
		} catch (e) {
		}
	}
});

const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const {itemEval} = require('../../../pobApi/ItemEval');

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {
			property: {}, weight: {}, filter: {},
			locked: {boolean: true}, shared: {boolean: true},
			buildValue: {}, buildValueTooltip: {},
		};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
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
		this.$('#filter').autocompletes = ['weight', 'and', 'not', 'conditional prefix', 'conditional suffix'];
		this.$('#filter').addEventListener('change', () => {
			this.filter = this.$('#filter').value;
			this.emit('change');
		});
		this.$('#locked').addEventListener('input', () => {
			this.locked = this.$('#locked').checked;
			this.emit('lock-change');
		});
		this.$('#shared').addEventListener('input', () => {
			this.shared = this.$('#shared').checked;
			this.emit('share-change');
		});
		this.$('#remove').addEventListener('click', () => this.emit('remove'));
		this.$('#build-value').addEventListener('click', () => {
			this.weight = this.buildValue;
			this.emit('change');
		});
		this.weight = this.weight || 0;
		this.filter = this.filter || 'weight';
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
		this.checkUseBuildValueVisible();
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

	set buildValue(value) {
		this.$('#build-value').textContent = value === '0' ? '' : value;
		this.checkUseBuildValueVisible();
	}

	set buildValueTooltip(value) {
		this.$('#build-value').title = value;
	}

	focus() {
		this.$('#property').focus();
	}

	checkUseBuildValueVisible() {
		this.$('#build-value').disabled = this.weight === this.buildValue;
	}

	async refreshBuild() {
		if (!this.property)
			return;
		let pluginNumber = 10;
		let summary = await itemEval.evalItemModSummary(this.property, pluginNumber);
		// todo make this parameterizable
		this.buildValue = Math.round((
			summary.dps * 80 / 3 +
			summary.life +
			summary.resist) /
			pluginNumber * 100) / 100;
		this.buildValueTooltip = summary.text;
		// todo allow pob query properties
		// todo show pob tooltips on items
	}
});

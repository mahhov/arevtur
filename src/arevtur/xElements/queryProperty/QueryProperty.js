const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {
			type: {},
			property: {},
			weight: {},
			filter: {},
			locked: {boolean: true},
			shared: {boolean: true},
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
		this.$('#weight').addEventListener('input', () => {
			this.weight = this.$('#weight').value;
			this.emit('change');
		});
		// todo allow build filter type that don't affect trade query but help obtain build weight hints
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
		this.$('#build-value').textContent = value;
		this.checkUseBuildValueVisible();
	}

	set buildValueTooltip(value) {
		this.$('#build-value').title = value;
	}

	focus() {
		this.$('#property').focus();
	}

	checkUseBuildValueVisible() {
		this.$('#build-value').disabled = this.buildValue === '0' || this.weight === this.buildValue;
	}

	async refreshBuild(itemEval = this.lastItemEval) {
		this.lastItemEval = itemEval;
		if (!itemEval)
			return;
		let summary = await itemEval.evalItemModSummary(this.type, this.property, 100);
		this.buildValue = summary.value;
		this.buildValueTooltip = summary.tooltip;
	}
});

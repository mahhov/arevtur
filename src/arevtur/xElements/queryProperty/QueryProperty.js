const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {property: {}, weight: {}, filter: {}, locked: {boolean: true}, shared: {boolean: true}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#property').addEventListener('change', () => {
			this.property = this.$('#property').value;
			this.emit('change');
		});
		this.$('#weight').addEventListener('input', () => {
			this.weight = this.$('#weight').value;
			this.emit('change');
		});
		this.$('#filter').autocompletes = ['weight', 'and', 'not'];
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
		this.weight = this.weight || 0;
		this.filter = this.filter || 'weight';
	}

	set properties(value) {
		this.$('#property').autocompletes = value;
	}

	set property(value) {
		this.$('#property').value = value;
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
});

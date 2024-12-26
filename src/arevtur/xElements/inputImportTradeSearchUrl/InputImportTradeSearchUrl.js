const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {url: {}, itemText: {}, weightText: {}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#import-url').addEventListener('click', () =>
			this.emit('import-url', this.$('#url').value));
		this.$('#import-item-text').addEventListener('click', () =>
			this.emit('import-item-text', this.$('#item-text').value));
		this.$('#import-weight-text').addEventListener('click', () =>
			this.emit('import-weight-text', this.$('#weight-text').value));
		this.url ||= '';
		this.itemText ||= '';
		this.weightText ||= '';
	}

	set url(value) {
		this.$('#url').value = value;
	}

	set itemText(value) {
		this.$('#item-text').value = value;
	}

	set weightText(value) {
		this.$('#weight-text').value = value;
	}
});

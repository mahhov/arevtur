const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class extends XElement {
	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#import-url').addEventListener('click', () =>
			this.emit('import-url', this.$('#text').value));
		this.$('#import-item-text').addEventListener('click', () =>
			this.emit('import-item-text', this.$('#text').value));
		this.$('#import-weight-list').addEventListener('click', () =>
			this.emit('import-weight-list', this.$('#text').value));
	}
});

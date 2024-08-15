const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class InputImportTradeSearchUrl extends XElement {
	static get attributeTypes() {
		return {url: {}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#import').addEventListener('click', () =>
			this.emit('import', this.$('#url').value));
		this.url ||= '';
	}

	set url(value) {
		this.$('#url').value = value;
	}
});

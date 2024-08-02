const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class InputImportTradeSearchUrl extends XElement {
	static get attributeTypes() {
		return {
			text: {},
		};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
	}

	set text(value) {
		this.$('#container').textContent = value;
		// todo color formatting
	}
});

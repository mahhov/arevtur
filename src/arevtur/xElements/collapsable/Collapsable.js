const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {title: {}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
	}

	set title(value) {
		this.$('#title').textContent = value;
	}
});

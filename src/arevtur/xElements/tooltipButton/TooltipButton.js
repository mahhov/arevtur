const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {
			text: {},
			tooltip: {},
		};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#button').addEventListener('click', () => this.emit('click'));
	}

	set text(value) {
		this.$('#button').textContent = value;
	}

	set tooltip(value) {
		this.$('#tooltip').text = value;
	}
});

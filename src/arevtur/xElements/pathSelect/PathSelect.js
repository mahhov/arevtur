const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {placeholder: {}, path: {}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('button').addEventListener('click', () => this.$('input').click());
		this.$('input').addEventListener('input', () => {
			this.path = this.$('input').files[0].path;
			this.emit('selected');
		});
	}

	set placeholder(value) {
		this.updateText();
	}

	set path(value) {
		this.updateText();
	}

	updateText() {
		this.$('button').textContent = this.path || this.placeholder;
	}
});

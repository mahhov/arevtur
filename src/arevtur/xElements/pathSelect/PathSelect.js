const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {placeholder: {}, path: {}, directory: {boolean: true}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('button').addEventListener('click', () => this.$('input').click());
		this.$('input').addEventListener('input', () => {
			let path = this.$('input').files[0].path;
			this.path = this.directory ? path.replace(/\\[^\\]*$/, '') : path;
			this.emit('selected');
		});
	}

	set placeholder(value) {
		this.updateText();
	}

	set path(value) {
		this.updateText();
	}

	set directory(value) {
		this.$('input').webkitdirectory = value;
	}

	updateText() {
		this.$('button').textContent = this.path?.slice(-30) || this.placeholder;
	}
});

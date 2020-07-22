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
		this.$('input').addEventListener('input', () => {
			let path = this.$('input').files[0].path;
			this.path = this.directory ? path.replace(/\\[^\\]*$/, '') : path;
			this.emit('selected');
		});
		this.$('#path').addEventListener('click', () => this.$('input').click());
		this.$('#clear').addEventListener('click', () => {
			this.path = '';
			this.emit('selected');
		});
	}

	set placeholder(value) {
		this.updateText();
	}

	set path(value) {
		this.$('input').value = '';
		this.updateText();
	}

	set directory(value) {
		this.$('input').webkitdirectory = value;
	}

	updateText() {
		this.$('#path').textContent = this.path?.slice(-30) || this.placeholder;
	}
});

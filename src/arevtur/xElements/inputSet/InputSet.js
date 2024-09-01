const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {name: {}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		if (this.draggable)
			return;
		this.$('#name').addEventListener('change', () => {
			this.name = this.$('#name').value;
			this.emit('name-change');
		});
		this.$('#remove').addEventListener('click', e => {
			this.emit('remove');
			e.stopPropagation();
		});
	}

	set name(value) {
		this.$('#name').value = value;
	}
});

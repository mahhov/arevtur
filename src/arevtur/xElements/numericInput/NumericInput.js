const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {
			min: {},
			max: {},
			step: {},
			value: {},
		};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('input').addEventListener('input', () => {
			if (Number(this.value) !== Number(this.$('input').value)) {
				this.value = this.$('input').value;
				this.emit('change');
			}
		});
		this.value ||= 0;
	}

	set min(value) {
		this.$('input').min = value;
	}

	set max(value) {
		this.$('input').max = value;
	}

	set step(value) {
		this.$('input').step = value;
	}

	set value(value) {
		if (Number(value) !== Number(this.$('input').value))
			this.$('input').value = value;
	}
});

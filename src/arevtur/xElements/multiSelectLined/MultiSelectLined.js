const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const {unique, updateElementChildren} = require('../../../util/util');

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {
			placeholder: {},
		};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.values = [];
		this.$('#input').addEventListener('change', () => {
			if (!this.$('#input').value)
				return;
			let values = this.values;
			values.push(this.$('#input').value);
			this.values = values;
			this.$('#input').value = '';
			this.$('#input').updateAutocompletes();
			this.emit('change');
		});
	}

	set placeholder(value) {
		this.$('#input').placeholder = value;
	}

	get autocompletes() {
		return this.$('#input').autocompletes;
	}

	set autocompletes(value) {
		return this.$('#input').autocompletes = value;
	}

	get values() {
		return [...this.$('#selected').children].map(s => s.textContent);
	}

	set values(value) {
		updateElementChildren(this.$('#selected'), value.filter(unique),
			() => {
				let button = document.createElement('button');
				button.addEventListener('click', () => {
					button.remove();
					this.emit('change');
				});
				return button;
			},
			(buttonEl, i, text) => buttonEl.textContent = text);
	}

	get valuesAsArray() {
		return this.autocompletes.map(value => this.values.includes(value));
	}

	set valuesAsArray(value) {
		this.values = this.autocompletes.filter((_, i) => value[i]);
	}
});

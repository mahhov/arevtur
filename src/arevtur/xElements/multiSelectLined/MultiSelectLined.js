const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {
			title: {},
		};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('slot').addEventListener('slotchange', () => this.checkForOptions());
		this.checkForOptions();

		this.values = [];
		this.$('select').addEventListener('change', () => {
			let values = this.values;
			values[this.$('select').selectedIndex - 1] = true;
			this.values = values;
			this.$('select').selectedIndex = 0;
			this.emit('change');
		});
	}

	checkForOptions() {
		this.$('slot').assignedElements()
			.forEach(el => this.$('select').appendChild(el));
	}

	set title(value) {
		this.$('#title-option').textContent = value;
	}

	get values() {
		return [...this.$('select').options]
			.filter((_, i) => i)
			.map(option => [...this.$('#selected').children].some(selected => option.value === selected.textContent));
	}

	set values(value) {
		this.clearChildren('#selected');
		value.forEach((v, i) => {
			if (!v)
				return;
			let el = document.createElement('button');
			el.textContent = this.$('select').options[i + 1].value;
			this.$('#selected').appendChild(el);
			el.addEventListener('click', () => {
				el.remove();
				this.emit('change');
			});
		});
	}
});

const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const Searcher = require('../../Searcher');

customElements.define(name, class AutocompleteInput extends XElement {
	static get attributeTypes() {
		return {size: {}, value: {}, placeholder: {}, freeForm: {boolean: true}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('input').addEventListener('focus', () => this.updateAutocompletes(true));
		this.$('input').addEventListener('change', () => this.internalSetValue(this.$('input').value));
		this.$('input').addEventListener('input', () => {
			this.updateAutocompletes();
			this.$('select').selectedIndex = -1;
		});
		this.$('input').addEventListener('keydown', e => {
			if (e.key === 'ArrowDown') {
				this.$('select').selectedIndex = 0;
				this.$('select').focus();
			} else if (e.key === 'ArrowUp') {
				this.$('select').selectedIndex = this.$('select').length - 1;
				this.$('select').focus();
			} else if (e.key === 'Enter') {
				if (this.$('select').options[0])
					this.internalSetValue(this.$('select').options[0].value);
			} else
				return;
			e.preventDefault();
		});
		this.$('select').addEventListener('keydown', e => {
			if (e.key === 'Enter')
				this.internalSetValue(this.$('select').selectedOptions[0].value);
			let arrowOut =
				e.key === 'ArrowDown' && this.$('select').selectedIndex === this.$('select').length - 1 ||
				e.key === 'ArrowUp' && this.$('select').selectedIndex === 0;
			if (arrowOut)
				e.preventDefault();
			if (arrowOut || e.key === 'Escape' || e.key === 'Enter' ||
				e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
				this.$('select').selectedIndex = -1;
				this.$('input').focus();
			}
		});
		this.autocompletes = this.autocompletes || [];
		this.size = this.size || 10;
	}

	get autocompletes() {
		return this.autocompletes_;
	}

	set autocompletes(value) {
		if (value === this.autocompletes_)
			return;
		this.autocompletes_ = value;
		this.value = this.$('input').value;
		this.updateAutocompletes();
	}

	set size(value) {
		this.$('select').size = value;
		this.updateAutocompletes();
	}

	set value(value) {
		if (value && !this.freeForm && !this.autocompletes.includes(value)) {
			this.value = '';
			this.$('input').classList.add('invalid');
		} else
			this.$('input').classList.remove('invalid');
		this.$('input').value = value;
	}

	set placeholder(value) {
		this.$('input').placeholder = value;
	}

	set freeForm(value) {
		this.value = this.$('input').value;
		this.updateAutocompletes();
	}

	internalSetValue(value) {
		this.value = value;
		this.$('input').value = value;
		this.emit('change');
	}

	updateAutocompletes(showAll = false) {
		let optionValues = AutocompleteInput.smartFilter(!showAll && this.$('input').value, this.autocompletes, 500);
		if (this.freeForm && optionValues[0] !== this.$('input').value)
			optionValues.unshift(this.$('input').value);
		XElement.clearChildren(this.$('select'));
		optionValues.forEach(v => {
			let optionEl = document.createElement('option');
			optionEl.textContent = v;
			optionEl.value = v; // necessary to prevent whitespace trimming
			this.$('select').appendChild(optionEl);
			optionEl.addEventListener('click', () => this.internalSetValue(optionEl.textContent));
		});
	}

	static smartFilter(input, array = [], maxSize = Infinity) {
		if (!input)
			return array.slice(0, maxSize);

		let searcher = new Searcher(input, false);
		let size = 0;
		return array.filter(v =>
			size < maxSize && searcher.test([v.match(/[a-z]+|[A-Z][a-z]*|\d+|./g).join(' ')]) && ++size);
	}

	focus() {
		this.$('input').focus();
	}
});

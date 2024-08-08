const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const Searcher = require('../../Searcher');

customElements.define(name, class AutocompleteInput extends XElement {
	static get attributeTypes() {
		return {size: {}, value: {}, placeholder: {}, freeform: {boolean: true}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.autocompletes = this.autocompletes || [];
		this.tooltips = [];
		this.size = this.size || 10;


		this.addEventListener('blur', () => {
			let optionEl = this.$('select').options[0];
			if (optionEl)
				this.internalSetValue(optionEl.value, optionEl.title, true);
		});

		this.$('input').addEventListener('focus', () => this.updateAutocompletes(true));
		this.$('input').addEventListener('change',
			() => this.internalSetValue(this.$('input').value, '', true));
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
				let optionEl = this.$('select').options[0];
				if (/*this.$('input').value &&*/ optionEl)
					this.internalSetValue(optionEl.value, optionEl.title, true);
			} else
				return;
			e.preventDefault();
		});

		this.$('select').addEventListener('keydown', e => {
			if (e.key === 'Enter') {
				let optionEl = this.$('select').selectedOptions[0];
				this.internalSetValue(optionEl.value, optionEl.title, false);
			}
			let arrowOut =
				e.key === 'ArrowDown' && this.$('select').selectedIndex ===
				this.$('select').length - 1 ||
				e.key === 'ArrowUp' && this.$('select').selectedIndex === 0;
			if (arrowOut)
				e.preventDefault();
			if (arrowOut || e.key === 'Escape' || e.key === 'Enter' ||
				e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
				this.$('select').selectedIndex = -1;
				this.$('input').focus();
			}
		});
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

	set tooltips(tooltips) {
		this.tooltips_ = tooltips;
		this.updateAutocompletes();
	}

	set size(value) {
		this.$('select').size = value;
		this.updateAutocompletes();
	}

	set value(value) {
		if (value && !this.freeform && !this.autocompletes.includes(value)) {
			this.value = '';
			this.$('input').classList.add('invalid');
		} else
			this.$('input').classList.remove('invalid');
		this.$('input').value = value;
	}

	set placeholder(value) {
		this.$('input').placeholder = value;
	}

	set freeform(value) {
		this.value = this.$('input').value;
		this.updateAutocompletes();
	}

	internalSetValue(value, tooltip, blur) {
		this.value = value;
		this.$('input').value = value;
		this.$('input').title = tooltip || '';
		if (blur)
			this.blur();
		this.emit('change');
	}

	updateAutocompletes(showAll = false) {
		let optionIndexes = AutocompleteInput.smartFilter(!showAll && this.$('input').value,
			this.autocompletes, 500);
		let optionValues = optionIndexes.map(i => this.autocompletes[i]);
		let optionTooltips = optionIndexes.map(i => this.tooltips_[i]);
		if (this.freeform && optionValues[0] !== this.$('input').value) {
			optionValues.unshift(this.$('input').value);
			optionTooltips.unshift(null);
		}
		XElement.clearChildren(this.$('select'));
		optionValues.forEach((v, i) => {
			let optionEl = document.createElement('option');
			optionEl.textContent = v;
			optionEl.value = v; // necessary to prevent whitespace trimming
			optionEl.title = optionTooltips[i] || '';
			this.$('select').appendChild(optionEl);
			optionEl.addEventListener('click',
				() => this.internalSetValue(optionEl.value, optionEl.title, true));
		});
	}

	static smartFilter(input, array = [], maxSize = Infinity) {
		if (!input)
			return [...Array(Math.min(array.length, maxSize))].map((_, i) => i);

		let searcher = new Searcher(input, false);
		let size = 0;
		return array
			.map((v, i) => {
				if (size > maxSize)
					return null;
				if (!searcher.test([v.match(/[a-z]+|[A-Z][a-z]*|\d+|./g).join(' ')]))
					return null;
				size++;
				return i;
			}).filter(v => v !== null);
	}

	focus() {
		this.$('input').focus();
	}
});

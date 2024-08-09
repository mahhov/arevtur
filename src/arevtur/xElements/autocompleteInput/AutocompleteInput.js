const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const Searcher = require('../../Searcher');

customElements.define(name, class AutocompleteInput extends XElement {
	constructor() {
		super();
		this.autocompletes = [];
		this.tooltips = [];
	}

	static get attributeTypes() {
		return {size: {}, value: {}, placeholder: {}, freeform: {boolean: true}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		// can't be done in constructor because XElement overrides the setters of attributeTypes to
		// go through HTML attributes, which don't exist until connectedCallback is called
		this.size = this.size || 10;

		this.$('input').addEventListener('focus', () => this.updateAutocompletesShown(true));
		this.$('input').addEventListener('change',
			() => {
				let optionEl = this.$('select').options[0];
				this.internalSetValue(optionEl?.value || this.$('input').value,
					optionEl?.title || '', true);
			});
		this.$('input').addEventListener('input', () => {
			this.updateAutocompletesShown();
			this.$('select').selectedIndex = -1;
		});
		this.$('input').addEventListener('keydown', e => {
			if (e.key === 'ArrowDown') {
				this.$('select').selectedIndex = 0;
				this.$('select').focus();
			} else if (e.key === 'ArrowUp') {
				this.$('select').selectedIndex = this.$('select').length - 1;
				this.$('select').focus();
			} else if (e.key === 'Enter' || e.key === 'Tab') {
				let optionEl = this.$('select').options[0];
				if (optionEl)
					this.internalSetValue(optionEl.value, optionEl.title, true);
			} else
				return;
			e.preventDefault();
		});

		this.$('select').addEventListener('keydown', e => {
			if (e.key === 'Enter' || e.key === 'Tab') {
				let optionEl = this.$('select').selectedOptions[0];
				this.internalSetValue(optionEl.value, optionEl.title, true);
			}
			let arrowOut =
				e.key === 'ArrowDown' && this.$('select').selectedIndex ===
				this.$('select').length - 1 ||
				e.key === 'ArrowUp' && this.$('select').selectedIndex === 0;
			if (arrowOut)
				e.preventDefault();
			if (arrowOut || e.key === 'Escape' || e.key === 'Enter' || e.key === 'Tab' ||
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
		this.autocompletes_ = value;
		this.updateAutocompletesShown();
		this.updateInputValidity();
	}

	set tooltips(tooltips) {
		this.tooltips_ = tooltips;
		this.updateAutocompletesShown();
	}

	set size(value) {
		this.$('select').size = value;
	}

	set value(value) {
		this.$('input').value = value;
		this.updateAutocompletesShown();
		this.updateInputValidity();
	}

	set placeholder(value) {
		this.$('input').placeholder = value;
	}

	set freeform(value) {
		this.updateInputValidity();
	}

	internalSetValue(value, tooltip, blur) {
		this.value = value;
		this.$('input').value = value;
		this.$('input').title = tooltip || '';
		if (blur)
			this.blur();
		this.emit('change');
	}

	updateInputValidity() {
		this.$('input').classList
			.toggle('invalid',
				this.value && !this.freeform && !this.autocompletes.includes(this.value));
	}

	updateAutocompletesShown(showAll = false) {
		let optionIndexes = AutocompleteInput.smartFilter(!showAll && this.$('input').value,
			this.autocompletes, 500);
		let options = optionIndexes.map(i => [this.autocompletes[i], this.tooltips_?.[i] || '']);
		if (this.freeform && options[0] !== this.value)
			options.unshift([this.$('input').value, null]);
		XElement.clearChildren(this.$('select'));
		options.forEach(([autocomplete, tooltip], i) => {
			let optionEl = document.createElement('option');
			optionEl.textContent = autocomplete;
			optionEl.value = autocomplete; // necessary to prevent whitespace trimming
			optionEl.title = tooltip || '';
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

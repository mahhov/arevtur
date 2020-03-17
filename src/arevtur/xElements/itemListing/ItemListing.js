const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

const listTuples = [
	['#sockets-list', 'sockets'],
	['#defense-list', 'defenseProperties'],
	['#enchant-list', 'enchantMods'],
	['#implicit-list', 'implicitMods'],
	['#explicit-list', 'explicitMods'],
	['#crafted-list', 'craftedMods'],
	['#pseudo-list', 'pseudoMods'],
];

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {selected: {boolean: true}, hovered: {boolean: true}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#whisper-button').addEventListener('click', e => {
			navigator.clipboard.writeText(this.itemData_.whisper);
			e.stopPropagation();
		});
		this.addEventListener('click', () => this.emit('select'));
		this.addEventListener('mouseenter', () => {
			if (!this.hovered)
				this.emit('hover', true);
		});
		this.addEventListener('mouseleave', () => this.emit('hover', false));
	}

	set itemData(value) {
		this.itemData_ = value;

		this.$('#name-text').textContent = value.name;
		this.$('#type-text').textContent = value.type;

		this.$('#corrupted-text').classList.toggle('hidden', !value.corrupted);

		listTuples.forEach(([containerQuery, propertyName]) => {
			XElement.clearChildren(this.$(containerQuery));
			value[propertyName].forEach(mod => {
				let modDiv = document.createElement('div');
				modDiv.textContent = mod;
				this.$(containerQuery).appendChild(modDiv);
			});
		});


		this.$('#prefixes-text').textContent = value.affixes.prefix;
		this.$('#suffixes-text').textContent = value.affixes.suffix;
		this.$('#affix-value-text').textContent = value.valueDetails.affixValueShift;

		this.$('#defense-value-text').textContent = value.valueDetails.defensePropertiesValue;

		this.$('#weight-value-text').textContent = value.valueDetails.weightValue;

		this.$('#value-text').textContent = value.evalValue;
		this.$('#price-text').textContent = value.evalPrice;
		this.$('#price-expanded-text').textContent = value.priceText;
		this.$('#whisper-button').textContent = value.accountText;

		this.selected = value.selected;
		this.hovered = value.hovered;
	}

	set selected(value) {
		this.classList.toggle('selected', value);
	}

	set hovered(value) {
		this.classList.toggle('hovered', value);
	}

	get searchText() {
		return [...this.$$(':host > div:not(.hidden)')]
			.map(el => el.textContent)
			.join(' ');
	}
});

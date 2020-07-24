const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

const now = new Date();
const msInHour = 1000 * 60 * 60;

const round = n => Math.round(n * 10) / 10;

const listTuples = [
	['#influence-list', 'influences'],
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
		this.$('#copy-item-button').addEventListener('click', e => {
			this.itemData_.valueBuild.then(valueBuild => {
				valueBuild = valueBuild.substring(0, valueBuild.indexOf('Note:'));
				navigator.clipboard.writeText(valueBuild);
			});
			e.stopPropagation();
		});
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
		this.$('#item-level-text').textContent = value.itemLevel;

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
		this.$('#affix-value-text').textContent = value.valueDetails.affixes;
		this.$('#defense-value-text').textContent = value.valueDetails.defenses;
		this.$('#weight-value-text').textContent = value.valueDetails.mods;

		this.$('#value-text').textContent = round(value.evalValue);
		let expandedValues = Object.entries(value.valueDetails).filter(([_, value]) => value);
		this.$('#value-expanded-text').textContent = expandedValues.length > 1 ?
			expandedValues.map(([name, value]) => `${round(value)} ${name}`).join(' + ') : '';
		value.valueBuild.then(valueBuild => {
			this.$('#value-build-tooltip').textContent = valueBuild;
			this.$('#value-build-link').classList.toggle('hidden', !valueBuild);
		});
		this.$('#price-text').textContent = round(value.evalPrice);
		let expandedPriceShifts = Object.entries(value.priceDetails.shifts).map(([name, value]) => ` + ${name} (${round(value)} chaos)`);
		this.$('#price-expanded-text').textContent = value.priceDetails.currency !== 'chaos' || expandedPriceShifts.length ?
			`${value.priceDetails.count} ${value.priceDetails.currency}${expandedPriceShifts.join('')}` : '';
		this.$('#whisper-button').textContent = value.accountText;
		let dateDiff = (now - new Date(value.date)) / msInHour;
		this.$('#date-text').textContent = dateDiff > 24 ? `${round(dateDiff / 24)} days ago` : `${round(dateDiff)} hours ago`;

		this.selected = value.selected;
		this.hovered = value.hovered;
	}

	set selected(value) {
		this.classList.toggle('selected', value);
	}

	set hovered(value) {
		this.classList.toggle('hovered', value);
	}

	get searchTexts() {
		return [...this.$$('div')]
			.filter(div => !div.querySelector('div') && !div.classList.contains('hidden'))
			.map(div => div.textContent.trim().replace(/\s+/g, ' '))
			.filter(text => text);
	}
});

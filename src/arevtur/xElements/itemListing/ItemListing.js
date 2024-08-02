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
			navigator.clipboard.writeText(this.itemData_.text);
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

	set itemData(data) {
		this.itemData_ = data;

		this.$('#name-text').textContent = data.name;
		this.$('#type-text').textContent = data.type;
		this.$('#item-level-text').textContent = data.itemLevel;

		this.$('#corrupted-text').classList.toggle('hidden', !data.corrupted);

		listTuples.forEach(([containerQuery, propertyName]) => {
			XElement.clearChildren(this.$(containerQuery));
			data[propertyName].forEach(mod => {
				let modDiv = document.createElement('div');
				modDiv.textContent = mod;
				this.$(containerQuery).appendChild(modDiv);
			});
		});

		this.$('#prefixes-text').textContent = data.affixes.prefix;
		this.$('#suffixes-text').textContent = data.affixes.suffix;
		this.$('#affix-value-text').textContent = data.valueDetails.affixes;
		this.$('#defense-value-text').textContent = data.valueDetails.defenses;
		this.$('#weight-value-text').textContent = data.valueDetails.mods;

		this.$('#value-text').textContent = round(data.evalValue);
		let expandedValues = Object.entries(data.valueDetails).filter(([_, value]) => value);
		this.$('#value-expanded-text').textContent = expandedValues.length > 1 ?
			expandedValues.map(([name, value]) => `${round(value)} ${name}`).join(' + ') : '';
		data.valueBuild.then(valueBuild => {
			this.$('#value-build').classList.toggle('hidden', !valueBuild);
			this.$('#value-build').tooltip = valueBuild?.text;
		});
		this.$('#price-text').textContent = round(data.evalPrice);
		let expandedPriceShifts = Object.entries(data.priceDetails.shifts).map(([name, value]) => ` + ${name} (${round(value)} chaos)`);
		this.$('#price-expanded-text').textContent = data.priceDetails.currency !== 'chaos' || expandedPriceShifts.length ?
			`${data.priceDetails.count} ${data.priceDetails.currency}${expandedPriceShifts.join('')}` : '';
		this.$('#whisper-button').textContent = data.accountText;
		let dateDiff = (now - new Date(data.date)) / msInHour;
		this.$('#date-text').textContent = dateDiff > 24 ? `${round(dateDiff / 24)} days ago` : `${round(dateDiff)} hours ago`;

		this.selected = data.selected;
		this.hovered = data.hovered;
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

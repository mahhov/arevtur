const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const pobApi = require('../../../services/pobApi/pobApi');
const {round} = require('../../../util/util');

customElements.define(name, class InputBuildWeight extends XElement {
	static get attributeTypes() {
		return {
			name: {},
			currentValue: {},
			percentWeight: {},
			flatWeight: {},
			flatWeightType: {boolean: true},
		};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#weight-type').autocompletes = [
			'1% more',
			'+1 flat',
		];

		[
			this.$('#name'),
			this.$('#percent-weight'),
			this.$('#flat-weight'),
			this.$('#weight-type'),
		].forEach(el => el.addEventListener('change', () => this.emit('change')));

		this.$('#remove').addEventListener('click', () => this.emit('remove'));
	}

	focus() {
		this.$('#name').focus();
	}

	async update(stats, {name, percentWeight, flatWeight, flatWeightType}) {
		this.$('#name').autocompletes = Object.keys(stats).map(InputBuildWeight.addSpace).sort();

		let currentValue = stats[name] || 0;
		this.$('#current-value').textContent = currentValue ? round(currentValue, 2) : '';
		this.$('#current-value').title = currentValue;

		let percent = .01 * currentValue;
		if (flatWeightType)
			percentWeight = flatWeight * percent;
		else
			flatWeight = currentValue ? percentWeight / percent : 0;

		this.$('#name').value = InputBuildWeight.addSpace(name);
		this.$('#percent-weight').value = percentWeight;
		this.$('#flat-weight').value = flatWeight;
		this.$('#weight-type').value = this.$('#weight-type').autocompletes [flatWeightType ? 1 : 0];
		this.$('#percent-weight').disabled = flatWeightType;
		this.$('#flat-weight').disabled = !flatWeightType;
	}

	toConfig() {
		return {
			name: InputBuildWeight.removeSpace(this.$('#name').value || ''),
			percentWeight: Number(this.$('#percent-weight').value),
			flatWeight: Number(this.$('#flat-weight').value),
			flatWeightType: this.$('#weight-type').value === this.$('#weight-type').autocompletes[1],
		};
	}

	static addSpace(string) {
		return string.replaceAll(/([a-z])([A-Z])/g, '$1 $2');
	}

	static removeSpace(string) {
		return string.replaceAll(/ /g, '');
	}
});

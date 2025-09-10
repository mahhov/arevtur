const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const {round} = require('../../../util/util');

customElements.define(name, class InputBuildWeight extends XElement {
	static get attributeTypes() {
		return {};
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

	update(buildStatNames, {name, currentValue, percentWeight, flatWeight, flatWeightType}) {
		this.$('#name').autocompletes = [''].concat(buildStatNames.map(InputBuildWeight.addSpace).sort());
		this.$('#current-value').textContent = currentValue ? round(currentValue, 2) : '';
		this.$('#current-value').title = currentValue;
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

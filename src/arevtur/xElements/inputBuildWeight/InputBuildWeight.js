const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const pobApi = require('../../../services/pobApi/pobApi');
const {round} = require('../../../util/util');

customElements.define(name, class InputBuildWeight extends XElement {
	static get attributeTypes() {
		return {
			name: {},
			weight: {},
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
		this.$('#weight-type').value = this.$('#weight-type').autocompletes[0];
		this.alternativeWeight = 0;
		this.currentValue = 0;

		this.$('#name').addEventListener('change', async () => {
			this.name = InputBuildWeight.removeSpace(this.$('#name').value);
			this.updateCurrentValue();
			this.emit('change');
		});
		this.$('#weight').addEventListener('change', () => {
			this.weight = this.$('#weight').value;
			this.updateAlternativeWeight();
			this.emit('change');
		});
		this.$('#weight-type').addEventListener('change', () => {
			this.flatWeightType = this.$('#weight-type').value === this.$('#weight-type').autocompletes[1];
			this.updateAlternativeWeight();
			this.emit('change');
		});
		this.$('#alternative-weight').addEventListener('click', () => {
			this.weight = this.alternativeWeight;
			this.flatWeightType = !this.flatWeightType;
			this.updateAlternativeWeight();
			this.emit('change');
		});
		this.$('#remove').addEventListener('click', () => this.emit('remove'));

		pobApi.addListener('change', async () => this.updateStats());
		this.updateStats();
	}

	set name(value) {
		this.$('#name').value = InputBuildWeight.addSpace(value);
	}

	set weight(value) {
		this.$('#weight').value = value;
	}

	set flatWeightType(value) {
		this.$('#weight-type').value = this.$('#weight-type').autocompletes [value ? 1 : 0];
	}

	focus() {
		this.$('#name').focus();
	}

	async updateStats() {
		let stats = await pobApi.queryBuildStats();
		this.$('#name').autocompletes = Object.keys(stats).map(InputBuildWeight.addSpace).sort();
		this.updateCurrentValue();
	}

	async updateCurrentValue() {
		let stats = await pobApi.queryBuildStats();
		this.currentValue = stats[this.name];
		this.$('#current-value').textContent = stats[this.name] ? round(this.currentValue, 2) : '';
		this.$('#current-value').title = this.currentValue;
		this.updateAlternativeWeight();
	}

	async updateAlternativeWeight() {
		let percent = .01 * this.currentValue;
		this.alternativeWeight = this.flatWeightType ?
			this.weight * percent :
			percent ? this.weight / percent : 0;
		this.$('#alternative-weight').textContent = round(this.alternativeWeight, 5);
		this.$('#alternative-weight').title = this.flatWeightType ?
			'The equivalent weight of 1% more' :
			'The equivalent weight of +1 flat';
	}

	static addSpace(string) {
		return string.replaceAll(/([a-z])([A-Z])/g, '$1 $2');
	}

	static removeSpace(string) {
		return string.replaceAll(/ /g, '');
	}
});

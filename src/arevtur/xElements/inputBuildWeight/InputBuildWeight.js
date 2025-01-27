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

		pobApi.addListener('change', async () => {
			let stats = await pobApi.queryBuildStats();
			this.$('#name').autocompletes = Object.keys(stats).map(InputBuildWeight.addSpace);
			this.updateCurrentValue();
		});

		this.$('#name').addEventListener('change', async () => {
			this.name = InputBuildWeight.removeSpace(this.$('#name').value);
			this.updateCurrentValue();
			this.emit('change');
		});
		this.$('#weight').addEventListener('change', () => {
			this.weight = this.$('#weight').value;
			this.emit('change');
		});
		this.$('#weight-type').addEventListener('change', () => {
			this.flatWeightType = this.$('#weight-type').value === this.$('#weight-type').autocompletes[1];
			this.emit('change');
		});
		this.$('#remove').addEventListener('click', () => this.emit('remove'));
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

	async updateCurrentValue() {
		let stats = await pobApi.queryBuildStats();
		this.$('#current-value').textContent = stats[this.name] ? round(stats[this.name], 2) : '';
		this.$('#current-value').title = stats[this.name];
	}

	static addSpace(string) {
		return string.replaceAll(/([a-z])([A-Z])/g, '$1 $2');
	}

	static removeSpace(string) {
		return string.replaceAll(/ /g, '');
	}
});

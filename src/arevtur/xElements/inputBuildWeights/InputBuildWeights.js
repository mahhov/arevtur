const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const configForRenderer = require('../../../services/config/configForRenderer');
const {updateElementChildren} = require('../../../util/util');

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#list').addEventListener('arrange', () => this.saveConfig());

		configForRenderer.addListener('change', config => this.loadConfig());
	}

	loadConfig() {
		let weights = configForRenderer.config.weights2;
		if (!weights.length || weights[weights.length - 1].name)
			weights.push({name: '', weight: '', flatWeightType: false});

		updateElementChildren(this.$('#list'), weights,
			(i, values) => {
				let el = document.createElement('x-input-build-weight');
				el.slot = 'list';
				el.addEventListener('change', () => {
					this.saveConfig();
				});
				el.addEventListener('remove', () => {
					el.remove();
					this.saveConfig();
				});
				return el;
			}, (inputBuildWeight, i, value) => {
				inputBuildWeight.name = value.name;
				inputBuildWeight.weight = value.weight;
				inputBuildWeight.flatWeightType = value.flatWeightType;
			});
	}

	saveConfig() {
		configForRenderer.config = {
			weights2: [...this.$('#list').children].map(inputBuildWeight => ({
				name: inputBuildWeight.name,
				weight: inputBuildWeight.weight,
				flatWeightType: inputBuildWeight.flatWeightType,
			})),
		};
	}
});

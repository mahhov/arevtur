const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const configForRenderer = require('../../../services/config/configForRenderer');
const {updateElementChildren, round} = require('../../../util/util');
const pobApi = require('../../../services/pobApi/pobApi');

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#list').addEventListener('arrange', () => this.saveConfig());

		this.addEventListener('keydown', e => {
			if (e.key === 'Tab' && e.ctrlKey && !e.shiftKey)
				this.shadowRoot.activeElement.nextElementSibling?.focus();
			if (e.key === 'Tab' && e.ctrlKey && e.shiftKey)
				this.shadowRoot.activeElement.previousElementSibling?.focus();
		});

		configForRenderer.addListener('change', config => this.loadConfig());

		pobApi.addListener('change', async () => this.loadConfig());
	}

	async loadConfig() {
		let weights = configForRenderer.config.weights2;
		if (!weights.length || weights[weights.length - 1].name)
			weights.push({name: '', percentWeight: 0, flatWeight: 0, flatWeightType: false});

		let buildStats = await pobApi.queryBuildStats() || {};

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
			}, (inputBuildWeight, i, value) =>
				inputBuildWeight.update(buildStats, value));

		pobApi.setParams(configForRenderer.config.buildParams, configForRenderer.config.weights2);
	}

	saveConfig() {
		configForRenderer.config = {
			weights2: [...this.$('#list').children]
				.map(inputBuildWeight => inputBuildWeight.toConfig()),
		};
	}
});

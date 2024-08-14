const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const pobApi = require('../../../pobApi/pobApi');
const appData = require('../../../services/appData');
const {configForRenderer} = require('../../../services/configForRenderer');

customElements.define(name, class InputBuild extends XElement {
	static get attributeTypes() {
		return {};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#pob-path').defaultPath = appData.defaultPobPath;
		this.$('#build-path').defaultPath = appData.defaultPobBuildsPath;
		this.$('#pob-path').addEventListener('selected', () => {
			this.saveConfig();
			this.updatePob();
		});
		this.$('#build-path').addEventListener('selected', () => {
			this.saveConfig();
			this.updatePob();
		});
		this.$('#refresh').addEventListener('click', () => pobApi.restart());
		[
			this.$('#life-weight'),
			this.$('#resist-weight'),
			this.$('#damage-weight'),
			this.$('#attribute-str-weight'),
			this.$('#attribute-dex-weight'),
			this.$('#attribute-int-weight'),
		]
			.forEach(weight => weight.addEventListener('input', () => {
				this.saveConfig();
				this.updatePob();
			}));

		configForRenderer.addListener('change', config => this.loadConfig());
		this.loadConfig();
	}

	loadConfig() {
		let buildParams = configForRenderer.config.buildParams;
		this.$('#pob-path').path = buildParams.pobPath || '';
		this.$('#build-path').path = buildParams.buildPath || '';
		this.$('#life-weight').value = buildParams.weights.life || 0;
		this.$('#resist-weight').value = buildParams.weights.resist || 0;
		this.$('#damage-weight').value = buildParams.weights.damage || 0;
		this.$('#attribute-str-weight').value = buildParams.weights.str || 0;
		this.$('#attribute-dex-weight').value = buildParams.weights.dex || 0;
		this.$('#attribute-int-weight').value = buildParams.weights.int || 0;
		// todo[high] allow custom weights
		this.updatePob();
	}

	saveConfig() {
		configForRenderer.config = {buildParams: this.params};
	}

	updatePob() {
		pobApi.setParams(this.params);
	}

	get params() {
		return {
			pobPath: this.$('#pob-path').path,
			buildPath: this.$('#build-path').path,
			weights: {
				life: Number(this.$('#life-weight').value) || 0,
				resist: Number(this.$('#resist-weight').value) || 0,
				dps: Number(this.$('#damage-weight').value) || 0,
				str: Number(this.$('#attribute-str-weight').value) || 0,
				dex: Number(this.$('#attribute-dex-weight').value) || 0,
				int: Number(this.$('#attribute-int-weight').value) || 0,
			},
		};
	}
});

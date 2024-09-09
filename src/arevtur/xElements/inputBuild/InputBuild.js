const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const pobApi = require('../../../services/pobApi/pobApi');
const appData = require('../../../services/appData');
const configForRenderer = require('../../../services/config/configForRenderer');

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#pob-path').defaultPath = appData.defaultPobPath;
		this.$('#build-path').defaultPath = appData.defaultPobBuildsPath;
		this.$('#pob-path').addEventListener('selected', () => this.saveConfig());
		this.$('#build-path').addEventListener('selected', () => this.saveConfig());
		this.$('#refresh').addEventListener('click', () => pobApi.restart());
		[
			this.$('#life-weight'),
			this.$('#elemental-resist-weight'),
			this.$('#chaos-resist-weight'),
			this.$('#damage-weight'),
			this.$('#attribute-str-weight'),
			this.$('#attribute-dex-weight'),
			this.$('#attribute-int-weight'),
			this.$('#ignore-es-check'),
			this.$('#equal-elemental-resists-check'),
			this.$('#equal-chaos-resist-check'),
		].forEach(weight => weight.addEventListener('change', () => this.saveConfig()));

		configForRenderer.addListener('change', config => this.loadConfig());
	}

	loadConfig() {
		let buildParams = configForRenderer.config.buildParams;
		this.$('#pob-path').path = buildParams.pobPath;
		this.$('#build-path').path = buildParams.buildPath;
		// todo[low] allow custom weights
		this.$('#life-weight').value = buildParams.weights.life;
		this.$('#elemental-resist-weight').value = buildParams.weights.elementalResist;
		this.$('#chaos-resist-weight').value = buildParams.weights.chaosResist;
		this.$('#damage-weight').value = buildParams.weights.damage;
		this.$('#attribute-str-weight').value = buildParams.weights.str;
		this.$('#attribute-dex-weight').value = buildParams.weights.dex;
		this.$('#attribute-int-weight').value = buildParams.weights.int;
		this.$('#ignore-es-check').checked = buildParams.extraMods.ignoreEs;
		this.$('#equal-elemental-resists-check').checked =
			buildParams.extraMods.equalElementalResists;
		this.$('#equal-chaos-resist-check').checked = buildParams.extraMods.equalChaosResist;
		pobApi.setParams(configForRenderer.config.buildParams);
	}

	saveConfig() {
		configForRenderer.config = {
			buildParams: {
				pobPath: this.$('#pob-path').path,
				buildPath: this.$('#build-path').path,
				weights: {
					life: Number(this.$('#life-weight').value) || 0,
					elementalResist: Number(this.$('#elemental-resist-weight').value) || 0,
					chaosResist: Number(this.$('#chaos-resist-weight').value) || 0,
					damage: Number(this.$('#damage-weight').value) || 0,
					str: Number(this.$('#attribute-str-weight').value) || 0,
					dex: Number(this.$('#attribute-dex-weight').value) || 0,
					int: Number(this.$('#attribute-int-weight').value) || 0,
				},
				extraMods: {
					ignoreEs: Number(this.$('#ignore-es-check').checked) || false,
					equalElementalResists: Number(
						this.$('#equal-elemental-resists-check').checked) || false,
					equalChaosResist: Number(this.$('#equal-chaos-resist-check').checked) || false,
				},
			},
		};
	}
});

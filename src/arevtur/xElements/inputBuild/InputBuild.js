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
			this.$('#effective-health-weight'),
			this.$('#total-life-weight'),
			this.$('#total-mana-weight'),
			this.$('#mana-regen-weight'),
			this.$('#elemental-resist-weight'),
			this.$('#chaos-resist-weight'),
			this.$('#damage-weight'),
			this.$('#attribute-str-weight'),
			this.$('#attribute-dex-weight'),
			this.$('#attribute-int-weight'),
			this.$('#include-eldritch-check'),
			this.$('#include-influence-check'),
			this.$('#include-talisman-check'),
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
		this.$('#effective-health-weight').value = buildParams.weights.effectiveHealth;
		this.$('#total-life-weight').value = buildParams.weights.totalLife;
		this.$('#total-mana-weight').value = buildParams.weights.totalMana;
		this.$('#mana-regen-weight').value = buildParams.weights.manaRegen;
		this.$('#elemental-resist-weight').value = buildParams.weights.elementalResist;
		this.$('#chaos-resist-weight').value = buildParams.weights.chaosResist;
		this.$('#damage-weight').value = buildParams.weights.damage;
		this.$('#attribute-str-weight').value = buildParams.weights.str;
		this.$('#attribute-dex-weight').value = buildParams.weights.dex;
		this.$('#attribute-int-weight').value = buildParams.weights.int;
		this.$('#include-eldritch-check').value = buildParams.options.includeInfluence;
		this.$('#include-influence-check').value = buildParams.options.includeInfluence;
		this.$('#include-talisman-check').value = buildParams.options.includeTalisman;
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
					effectiveHealth: Number(this.$('#effective-health-weight').value) || 0,
					totalLife: Number(this.$('#total-life-weight').value) || 0,
					totalMana: Number(this.$('#total-mana-weight').value) || 0,
					manaRegen: Number(this.$('#mana-regen-weight').value) || 0,
					elementalResist: Number(this.$('#elemental-resist-weight').value) || 0,
					chaosResist: Number(this.$('#chaos-resist-weight').value) || 0,
					damage: Number(this.$('#damage-weight').value) || 0,
					str: Number(this.$('#attribute-str-weight').value) || 0,
					dex: Number(this.$('#attribute-dex-weight').value) || 0,
					int: Number(this.$('#attribute-int-weight').value) || 0,
				},
				options: {
					includeEldritch: this.$('#include-eldritch-check').checked,
					includeInfluence: this.$('#include-influence-check').checked,
					includeTalisman: this.$('#include-talisman-check').checked,
				},
				extraMods: {
					ignoreEs: this.$('#ignore-es-check').checked,
					equalElementalResists: this.$('#equal-elemental-resists-check').checked,
					equalChaosResist: this.$('#equal-chaos-resist-check').checked,
				},
			},
		};
	}
});

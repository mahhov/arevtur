const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const pobApi = require('../../../services/pobApi/pobApi');
const appData = require('../../../services/appData');
const configForRenderer = require('../../../services/config/configForRenderer');
const buildWeights = require('./buildWeights');

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

		buildWeights.forEach(buildWeight => {
			let label = document.createElement('label');
			label.textContent = buildWeight.display;
			label.title = buildWeight.tooltip;
			let input = document.createElement('x-numeric-input');
			input.min = 0;
			input.max = 1;
			input.step = .05;
			label.appendChild(input);
			this.$('#weights').appendChild(label);
			input.addEventListener('change', () => this.saveConfig());
		});

		[
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

		// todo[medium] allow custom weights
		buildWeights.forEach(((buildWeight, i) =>
			this.$('#weights').children[i].children[0].value = buildParams.weights[buildWeight.id]));

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
				weights: Object.fromEntries(buildWeights.map((buildWeight, i) =>
					[buildWeight.id, this.$('#weights').children[i].children[0].value || 0])),
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

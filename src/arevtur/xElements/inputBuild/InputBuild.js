const fs = require('fs');
const path = require('path');
const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const pobApi = require('../../../services/pobApi/pobApi');
const appData = require('../../../services/appData');
const configForRenderer = require('../../../services/config/configForRenderer');
const {updateElementChildren, round} = require('../../../util/util');

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
		this.$('#reload').addEventListener('click', () => pobApi.restart());

		this.$('#weights').addEventListener('arrange', () => this.saveConfig());

		this.$('#weights').addEventListener('keydown', e => {
			if (e.key === 'Tab' && e.ctrlKey && !e.shiftKey)
				this.shadowRoot.activeElement.nextElementSibling?.focus();
			if (e.key === 'Tab' && e.ctrlKey && e.shiftKey)
				this.shadowRoot.activeElement.previousElementSibling?.focus();
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
		pobApi.addListener('change', async () => this.loadConfig());
	}

	async loadConfig() {
		let buildParams = configForRenderer.config.buildParams;
		this.$('#pob-path').path = buildParams.pobPath;
		this.$('#build-path').path = buildParams.buildPath;

		await this.loadConfigWeights();

		this.$('#include-eldritch-check').value = buildParams.options.includeInfluence;
		this.$('#include-influence-check').value = buildParams.options.includeInfluence;
		this.$('#include-talisman-check').value = buildParams.options.includeTalisman;
		this.$('#ignore-es-check').checked = buildParams.extraMods.ignoreEs;
		this.$('#equal-elemental-resists-check').checked =
			buildParams.extraMods.equalElementalResists;
		this.$('#equal-chaos-resist-check').checked = buildParams.extraMods.equalChaosResist;

		pobApi.setParams(configForRenderer.config.buildParams);

		fs.promises.stat(path.join(this.$('#pob-path').path, 'Launch.lua'))
			.then(() => true)
			.catch(() => false)
			.then(valid => this.$('#pob-path').valid = valid);
	}

	async loadConfigWeights() {
		let weights = configForRenderer.config.buildParams.weights2;
		if (!weights.length || weights[weights.length - 1].name)
			weights.push({name: '', percentWeight: 0, flatWeight: 0, flatWeightType: false});

		let buildStats = await pobApi.queryBuildStats().catch(() => ({}));

		updateElementChildren(this.$('#weights'), weights,
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
	}

	saveConfig() {
		configForRenderer.config = {
			buildParams: {
				pobPath: this.$('#pob-path').path,
				buildPath: this.$('#build-path').path,
				weights2: [...this.$('#weights').children]
					.map(inputBuildWeight => inputBuildWeight.toConfig()),
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

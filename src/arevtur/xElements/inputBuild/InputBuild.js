const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const pobApi = require('../../../pobApi/pobApi');
const appData = require('../../../services/appData');

customElements.define(name, class InputBuild extends XElement {
	static get attributeTypes() {
		return {};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		let store = this.store;
		this.$('#pob-path').path = store.pobPath || '';
		this.$('#build-path').path = store.buildPath || '';
		this.$('#life-weight').value = store.lifeWeight || .5;
		this.$('#resist-weight').value = store.resistWeight || .1;
		this.$('#damage-weight').value = store.damageWeight || .25;

		this.$('#pob-path').defaultPath = appData.defaultPobPath;
		this.$('#build-path').defaultPath = appData.defaultPobBuildsPath;
		this.$('#pob-path').addEventListener('selected', () => {
			this.updateStore();
			this.updatePob();
		});
		this.$('#build-path').addEventListener('selected', () => {
			this.updateStore();
			this.updateBuild();
		});
		this.$('#refresh').addEventListener('click', () => pobApi.restart());
		[this.$('#life-weight'), this.$('#resist-weight'), this.$('#damage-weight')]
			.forEach(weight => weight.addEventListener('input', () => {
				this.updateStore();
				this.updateParamValues();
			}));

		this.updatePob();
		this.updateBuild();
		this.updateParamValues();
	}

	get store() {
		try {
			return JSON.parse(localStorage.getItem('input-build-config')) || {};
		} catch (e) {
			return {};
		}
	}

	updateStore() {
		let store = {
			pobPath: this.$('#pob-path').path,
			buildPath: this.$('#build-path').path,
			lifeWeight: this.$('#life-weight').value,
			resistWeight: this.$('#resist-weight').value,
			damageWeight: this.$('#damage-weight').value,
		};
		localStorage.setItem('input-build-config', JSON.stringify(store));
	}

	updatePob() {
		pobApi.pobPath = this.$('#pob-path').path;
	}

	updateBuild() {
		pobApi.build = this.$('#build-path').path;
	}

	updateParamValues() {
		pobApi.valueParams = {
			life: Number(this.$('#life-weight').value) || 0,
			resist: Number(this.$('#resist-weight').value) || 0,
			dps: Number(this.$('#damage-weight').value) || 0,
		};
	}
});

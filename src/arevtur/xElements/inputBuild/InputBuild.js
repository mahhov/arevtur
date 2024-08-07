const path = require('path');
const fs = require('fs').promises;
const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const stream = require('bs-better-stream');
const ApiConstants = require('../../ApiConstants');
const pobApi = require('../../../pobApi/pobApi');

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

		InputBuild.defaultPobPath.each(path =>
			this.$('#pob-path').defaultPath = path);
		this.$('#build-path').defaultPath =
			path.resolve(`${process.env.HOME}/Documents/Path of Building/Builds`);
		this.$('#pob-path').addEventListener('selected', () => {
			this.updateStore();
			this.updatePob();
		});
		this.$('#build-path').addEventListener('selected', () => {
			this.updateStore();
			this.updateBuild();
		});
		this.$('#refresh').addEventListener('click', () => pobApi.refreshBuild());
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

	static get defaultPobPath() {
		// todo do we need to try/catch this?
		return stream().write(
			`${process.env.ProgramData}`,
			`${process.env.APPDATA}`,
			`${process.env.HOMEPATH}/Downloads`,
		)
			.map(dir => ({dir, entries: fs.readdir(dir, {withFileTypes: true})}))
			.waitOnOrdered('entries', true)
			.flattenOn('entries', 'entry')
			.filter(({entry}) => entry.isDirectory() && entry.name.match(/path ?of ?building/i))
			.filterCount(1)
			.map(({dir, entry}) => path.resolve(dir, entry.name));
	}
});

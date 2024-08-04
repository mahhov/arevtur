const path = require('path');
const fs = require('fs').promises;
const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const stream = require('bs-better-stream');
const ApiConstants = require('../../ApiConstants');
const PobApi = require('../../../pobApi/PobApi');

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
		this.$('#life-weight').value = store.lifeWeight || 1;
		this.$('#resist-weight').value = store.resistWeight || 1;
		this.$('#damage-weight').value = store.damageWeight || 1;

		InputBuild.defaultPobPath.each(path =>
			this.$('#pob-path').defaultPath = path);
		this.$('#build-path').defaultPath =
			path.resolve(`${process.env.HOME}/Documents/Path of Building/Builds`);
		Promise.all(Object.keys(ApiConstants.POB_TYPES)
			.map(typeId => ApiConstants.constants.typeIdToText(typeId)))
			.then(pobTypes => this.$('#demo-mod-type').autocompletes = pobTypes);
		ApiConstants.constants.propertyTexts()
			.then(propertyTexts => this.$('#demo-mod-property').autocompletes = propertyTexts);

		this.$('#pob-path').addEventListener('selected', () => {
			this.updateStore();
			this.updatePob();
			this.refresh();
		});
		this.$('#build-path').addEventListener('selected', () => {
			this.updateStore();
			this.updateBuild();
			this.refresh();
		});
		this.$('#refresh').addEventListener('click', () =>
			this.refresh());
		[this.$('#life-weight'), this.$('#resist-weight'), this.$('#damage-weight')]
			.forEach(weight => weight.addEventListener('input', () => {
				this.updateStore();
				this.updateValueParams();
				this.refresh();
			}));
		this.$('#demo-mod-type').addEventListener('change', () => this.updateDemo());
		this.$('#demo-mod-property').addEventListener('change', () => this.updateDemo());
		this.$('#demo-mod-value').addEventListener('input', () => this.updateDemo());
		this.$('#demo-mod-raw').addEventListener('input', () => this.updateDemo());

		this.updatePob();
		this.refresh();
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
		this.pobApi = new PobApi(this.$('#pob-path').path); // this.pobApi is public
		this.updateBuild();
		this.updateValueParams();
	}

	updateBuild() {
		this.pobApi.build = this.$('#build-path').path;
	}

	updateValueParams() {
		this.pobApi.valueParams = {
			life: Number(this.$('#life-weight').value) || 0,
			resist: Number(this.$('#resist-weight').value) || 0,
			dps: Number(this.$('#damage-weight').value) || 0,
		};
	}

	async refresh() {
		this.emit('refreshing', this.pobApi);
		if (this.$('#pob-path').path && this.$('#build-path').path) {
			await this.pobApi.ready;
			this.emit('refresh', this.pobApi);
		}
	}

	async updateDemo() {
		let summary = await this.pobApi.evalItemModSummary(
			this.$('#demo-mod-type').value,
			this.$('#demo-mod-property').value,
			this.$('#demo-mod-value').value || 100,
			this.$('#demo-mod-raw').checked);
		this.$('#demo-mod-weight').textContent = summary.value;
		this.$('#demo-mod-weight').title = summary.text;
	}

	static get defaultPobPath() {
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

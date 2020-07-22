const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const ApiConstants = require('../../ApiConstants');
const ItemEval = require('../../../pobApi/ItemEval');

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {}
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

		ApiConstants.constants.propertyTexts().then(propertyTexts =>
			this.$('#demo-mod-property').autocompletes = propertyTexts);

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
			return {}
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
		this.itemEval = new ItemEval(this.$('#pob-path').path); // this.itemEval is public
		this.updateBuild();
		this.updateValueParams();
	}

	updateBuild() {
		this.itemEval.build = this.$('#build-path').path;
	}

	updateValueParams() {
		this.itemEval.valueParams = {
			life: this.$('#life-weight').value,
			resist: this.$('#resist-weight').value,
			dps: this.$('#damage-weight').value,
		};
	}

	async refresh() {
		this.emit('refreshing', this.itemEval);
		if (this.$('#pob-path').path && this.$('#build-path').path) {
			await this.itemEval.ready;
			this.emit('refresh', this.itemEval);
		}
	}

	async updateDemo() {
		let summary = await this.itemEval.evalItemModSummary(
			this.$('#demo-mod-property').value,
			this.$('#demo-mod-value').value || 100,
			this.$('#demo-mod-raw').checked);
		this.$('#demo-mod-weight').textContent = summary.value;
		this.$('#demo-mod-weight').title = summary.tooltip;
	}
});

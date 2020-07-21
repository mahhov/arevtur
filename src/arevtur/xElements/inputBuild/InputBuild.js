const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
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
			dps: this.$('#resist-weight').value,
			resist: this.$('#damage-weight').value,
		};
	}

	async refresh() {
		this.emit('refreshing', this.itemEval);
		if (this.$('#pob-path').path && this.$('#build-path').path) {
			await this.itemEval.ready;
			this.emit('refresh', this.itemEval);
		}
	}
});

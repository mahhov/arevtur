const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {url: {}, itemText: {}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#import-url').addEventListener('click', () =>
			this.emit('import-url', this.$('#url').value));
		this.$('#import-item-text').addEventListener('click', () =>
			this.emit('import-item-text', this.$('#item-text').value));
		this.url ||= '';
		this.itemText ||= '';
	}

	set url(value) {
		this.$('#url').value = value;
	}

	set itemText(value) {
		this.$('#item-text').value = value;
	}
});

// todo[high] this import isn't working:
//  50% reduced Amount Recovered
//  135% increased Recovery rate
//  50% of Recovery applied Instantly
//  Grants Immunity to Chill for 13 seconds if used while Chilled
//  Grants Immunity to Freeze for 13 seconds if used while Frozen

const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const {configForRenderer} = require('../../../services/configForRenderer');

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {configKey: {}, text: {}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('button').addEventListener('click', () => configForRenderer.config =
			{[this.configKey]: !configForRenderer.config[this.configKey]});
	}

	set text(text) {
		this.$('button').textContent = text;
	}
});

configForRenderer.listenConfigChange(config => {
	document.documentElement.classList.toggle('dark', config.darkTheme);
	document.documentElement.classList.toggle('horizontal', config.viewHorizontal);
});

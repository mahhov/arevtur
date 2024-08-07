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
	// undefined 2nd param would cause an actual toggle rather than removing the class
	document.documentElement.classList.toggle('maximize', config.viewMaximize || false);
	document.documentElement.classList.toggle('horizontal', config.viewHorizontal || false);
	document.documentElement.classList.toggle('dark', config.darkTheme || false);
});

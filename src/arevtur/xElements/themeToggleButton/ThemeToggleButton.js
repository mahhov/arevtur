const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const {configForRenderer} = require('../../../services/configForRenderer')

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('button').addEventListener('click', () =>
			configForRenderer.config = {darkTheme: !configForRenderer.config.darkTheme});
		configForRenderer.listenConfigChange(config =>
			document.documentElement.classList.toggle('dark', config.darkTheme));
	}
});

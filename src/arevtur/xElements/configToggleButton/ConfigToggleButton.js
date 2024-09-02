const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const {configForRenderer} = require('../../../services/configForRenderer');
const appData = require('../../../services/appData');

let toggle = key => configForRenderer.config = {[key]: !configForRenderer.config[key]};

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {configKey: {}, text: {}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('button').addEventListener('click', () => toggle(this.configKey));
	}

	set text(text) {
		this.$('button').textContent = text;
	}
});

document.addEventListener('keydown', e => {
	if (e.key === 'm' && e.ctrlKey)
		toggle('viewMaximize');
	if (e.key === 'h' && e.ctrlKey)
		toggle('viewHorizontal');
	if (e.key === 'd' && e.ctrlKey)
		toggle('darkTheme');
});

configForRenderer.addListener('change', config => {
	document.documentElement.classList.toggle('maximize', config.viewMaximize);
	document.documentElement.classList.toggle('horizontal',
		!config.viewMaximize && config.viewHorizontal);
	document.documentElement.classList.toggle('dark', config.darkTheme);
});

document.documentElement.classList.toggle('experimental', appData.isDev);

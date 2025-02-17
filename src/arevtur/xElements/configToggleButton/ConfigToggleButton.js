const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const configForRenderer = require('../../../services/config/configForRenderer');

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
	if (e.key === 'm' && e.ctrlKey && configForRenderer.config.tourComplete)
		toggle('viewMaximize');
	if (e.key === 'h' && e.ctrlKey && configForRenderer.config.tourComplete)
		toggle('viewHorizontal');
	if (e.key === 'd' && e.ctrlKey)
		toggle('darkTheme');
	if (e.key === 'e' && e.ctrlKey && configForRenderer.config.tourComplete)
		toggle('experimental');
});

document.addEventListener('mousedown', e => {
	if ((e.button === 3 || e.button === 4) && configForRenderer.config.tourComplete)
		toggle('viewMaximize');
});

configForRenderer.addListener('change', config => {
	document.documentElement.classList.toggle('maximize', config.viewMaximize);
	document.documentElement.classList.toggle('horizontal', config.viewHorizontal && !config.viewMaximize);
	document.documentElement.classList.toggle('dark', config.darkTheme);
	document.documentElement.classList.toggle('experimental', config.experimental);
	document.documentElement.classList.toggle('version-2', config.version2);
});

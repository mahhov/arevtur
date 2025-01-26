const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const {ipcRenderer} = require('electron');

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {
			placeholder: {},
			path: {},
			defaultPath: {},
			directory: {boolean: true},
			extension: {},
			valid: {boolean: true},
		};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#path').addEventListener('click', async () => {
			let dialogResponse = await ipcRenderer.invoke('open-dialog', {
				title: this.placeholder,
				defaultPath: this.path || this.defaultPath || '',
				properties: this.directory ? ['openDirectory'] : [],
				filters: [{name: '', extensions: [this.extension]}],
			});
			if (!dialogResponse.canceled) {
				this.path = dialogResponse.filePaths[0];
				this.emit('selected');
			}
		});
		this.$('#clear').addEventListener('click', () => {
			this.path = '';
			this.emit('selected');
		});
		this.valid = true;
	}

	set placeholder(value) {
		this.updateText();
	}

	set path(value) {
		this.updateText();
	}

	set valid(value) {
		this.$('#path').classList.toggle('invalid', !value);
	}

	updateText() {
		this.$('#path').textContent = this.path?.slice(-30) || this.placeholder;
		this.$('#path').title = this.path;
	}
});

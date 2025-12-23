const {ipcRenderer, shell} = require('electron');
const configForRenderer = require('../services/config/configForRenderer');
const appData = require('../services/appData');
const {openPath} = require('../util/util');

const ipcSend = message => ipcRenderer.send('window-request', message);

const $ = document.querySelector.bind(document);
const $c = document.createElement.bind(document);

document.addEventListener('keydown', ({code}) => {
	switch (code.toLowerCase()) {
		case 'enter':
		case 'escape':
		case 'space':
			ipcSend({name: 'close'});
			break;
	}
});

window.addEventListener('blur', () => ipcSend({name: 'close'}));

$('#restrict-window').addEventListener('change', () =>
	configForRenderer.config = {restrictToPoeWindow: $('#restrict-window').checked});

$('#open-config').addEventListener('click', () => openPath(appData.basePath));

$('#chat-notifications').addEventListener('change', () =>
	configForRenderer.config = {chatNotifications: $('#chat-notifications').checked});

configForRenderer.addListener('change', config => {
	$('#restrict-window').checked = configForRenderer.config.restrictToPoeWindow;
	$('#chat-notifications').checked = configForRenderer.config.chatNotifications;
	document.documentElement.classList.toggle('dark', config.darkTheme);
});

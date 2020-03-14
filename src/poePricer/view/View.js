const {ipcRenderer: ipc, shell} = require('electron');
const appData = require('../misc/appData');
const ipcSend = message => ipc.send('window-request', message);

const $ = document.querySelector.bind(document);
const $c = document.createElement.bind(document);

ipc.on('window-command', (_, command) => {
	console.log('received', command);
	switch (command.name) {
		case 'setTexts':
			updateTexts(command.texts);
			preferencesVisibility(false);
			break;
		case 'showPreferences':
			preferencesVisibility(true);
			break;
		default:
			console.error('Unknown window command:', command);
	}
});

let updateTexts = texts => {
	let container = $('#container');
	while (container.firstChild)
		container.firstChild.remove();

	texts.forEach(({text, textColor = '#000', backColor = '#fff'}) => {
		let lineTextEl = $c('span');
		lineTextEl.textContent = text;
		lineTextEl.style.color = textColor;
		lineTextEl.style.backgroundColor = backColor;
		let lineEl = $c('div');
		lineEl.appendChild(lineTextEl);
		container.appendChild(lineEl);
	});
};

let preferencesVisibility = visible => {
	let container = $('#container');
	container.classList.toggle('hidden', visible);
	let preferences = $('#preferences');
	preferences.classList.toggle('hidden', !visible)
};

document.body.addEventListener('keydown', ({code}) => {
	switch (code) {
		case 'Enter':
		case 'Escape':
			ipcSend({name: 'close'});
			break;
	}
});

let saveConfig = () => ipcSend({name: 'saveConfig', config: appData.config});

$('#preferences-league').value = appData.config.league;
$('#preferences-league').addEventListener('input', () => {
	appData.config.league = $('#preferences-league').value;
	saveConfig();
});

$('#preferences-restrict-window').checked = appData.config.restrictToPoeWindow;
$('#preferences-restrict-window').addEventListener('input', () => {
	appData.config.restrictToPoeWindow = $('#preferences-restrict-window').checked;
	saveConfig();
});

$('#preferences-open').addEventListener('click', () =>
	shell.openExternal(appData.basePath));

// todo lot of duplicate code with clipboardManager/view/View.html

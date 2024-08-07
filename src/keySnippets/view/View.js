const os = require('os');
const {ipcRenderer: ipc, shell} = require('electron');
const {configForRenderer} = require('../../services/configForRenderer');
const appData = require('../../services/appData');

const ipcSend = message => ipc.send('window-request', message);

const $ = document.querySelector.bind(document);
const $c = document.createElement.bind(document);

ipc.on('window-command', (_, command) => {
	switch (command.name) {
		case 'setTexts':
			updateTexts(command.texts);
			setVisibleContainer($('#text-container'));
			break;
		case 'setTable':
			updateTable(command.rows);
			setVisibleContainer($('#table-container'));
			break;
		case 'showPreferences':
			setVisibleContainer($('#preferences-container'));
			break;
		default:
			console.error('Unknown window command:', command);
	}
});

let updateTexts = texts => {
	let container = $('#text-container');
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

let updateTable = rows => {
	let container = $('#table-container');
	while (container.firstChild)
		container.firstChild.remove();

	let columns = rows[0].map((col, i) => rows.map(row => row[i]));
	columns.forEach(column => {
		let columnEl = $c('div');
		columnEl.classList.add('column');
		container.appendChild(columnEl);
		column.forEach(cellText => {
			let cellTextEl = $c('span');
			cellTextEl.classList.add('cell');
			cellTextEl.textContent = cellText;
			columnEl.appendChild(cellTextEl);
		});
		container.appendChild(columnEl);
	});
};

let setVisibleContainer = container => {
	[
		$('#text-container'),
		$('#table-container'),
		$('#preferences-container'),
	].forEach(c => c.classList.toggle('hidden', c !== container));
};

document.body.addEventListener('keydown', ({code}) => {
	switch (code) {
		case 'Enter':
		case 'Escape':
			ipcSend({name: 'close'});
			break;
	}
});

window.addEventListener('blur', () =>
	ipcSend({name: 'close'}));

document.body.addEventListener('mousedown', () =>
	ipcSend({name: 'prevent-close'}));

configForRenderer.listenConfigChange(config => {
	$('#preferences-league').value = config.league;
	$('#preferences-restrict-window').checked = configForRenderer.config.restrictToPoeWindow;
});

$('#preferences-league').addEventListener('input', () =>
	configForRenderer.config = {league: $('#preferences-league').value});

$('#preferences-restrict-window').addEventListener('input', () =>
	configForRenderer.config = {restrictToPoeWindow: $('#preferences-restrict-window').checked});

$('#preferences-open').addEventListener('click', () => {
	let path = (os.platform() === 'linux' ? 'file:' : '') + appData.basePath;
	shell.openExternal(path);
});

// todo lot of duplicate code with clipboardManager/view/View.html

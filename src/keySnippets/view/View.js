const os = require('os');
const {ipcRenderer: ipc, shell} = require('electron');
const {configForRenderer} = require('../../services/configForRenderer');
const appData = require('../../services/appData');

const ipcSend = message => ipc.send('window-request', message);

const $ = document.querySelector.bind(document);
const $c = document.createElement.bind(document);

ipc.on('window-command', (_, command) => {
	switch (command.name) {
		case 'setText':
			updateText(command.text);
			setVisibleContainer($('#text-container'));
			break;
		case 'setTable':
			updateTable(command.rows);
			setVisibleContainer($('#table-container'));
			break;
		case 'showPreferences':
			setVisibleContainer($('#preferences-container'));
			break;
		case 'open':
			break;
		default:
			console.error('Unknown window command:', command);
	}
});

let updateText = text => $('#text-container').text = text;

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
document.addEventListener('mousedown', () => ipcSend({name: 'prevent-close'}));

$('#preferences-restrict-window').addEventListener('input', () =>
	configForRenderer.config = {restrictToPoeWindow: $('#preferences-restrict-window').checked});

$('#reset-pob').addEventListener('click', () => ipcSend({name: 'reset-pob'}));

$('#preferences-open').addEventListener('click', () => {
	let path = (os.platform() === 'linux' ? 'file:' : '') + appData.basePath;
	shell.openExternal(path);
});

configForRenderer.addListener('change', config => {
	$('#preferences-restrict-window').checked = configForRenderer.config.restrictToPoeWindow;
	document.documentElement.classList.toggle('dark', config.darkTheme);
});

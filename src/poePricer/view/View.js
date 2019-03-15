const {ipcRenderer: ipc} = require('electron');

const $ = document.querySelector.bind(document);
const $c = document.createElement.bind(document);

ipc.on('window-command', (_, command) => {
	console.log('received', command);
	switch (command.name) {
		case 'setTexts':
			updateView(command.texts);
			break;
		case 'open':
			break;
		default:
			console.error('Unknown window command:', command);
	}
});

let updateView = texts => {
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
	})
};

document.body.addEventListener('keydown', ({code}) => {
	switch (code) {
		case 'Enter':
		case 'Escape':
			ipcSend({name: 'close'});
			break;
	}
});

let ipcSend = message => ipc.send('window-request', message);

// todo lot of duplicate code with clipboardManager/view/View.html

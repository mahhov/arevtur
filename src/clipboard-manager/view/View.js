const {ipcRenderer: ipc} = require('electron');
const Texts = require('./Texts');

const $ = document.querySelector.bind(document);
const $c = document.createElement.bind(document);

let texts = new Texts(10, 10);

ipc.on('window-command', (_, command) => {
	console.log('received', command);
	switch (command.name) {
		case 'addText':
			texts.addFront(command.text);
			break;
		case 'open':
			texts.selectFirst();
			updateView();
			break;
		default:
			console.error('Unknown window command:', command);
	}
});

let updateView = () => {
	let container = $('#container');
	while (container.firstChild)
		container.firstChild.remove();

	texts.getLinesForDisplay().forEach(({text, textColor = '#000', backColor = '#fff'}) => {
		let lineEl = $c('div');
		lineEl.textContent = text;
		lineEl.style.color = textColor;
		lineEl.style.backgroundColor = backColor;
		container.appendChild(lineEl);
	})
};

document.body.addEventListener('keydown', ({code}) => {
	switch (code) {
		case 'ArrowLeft':
			texts.selectFirst();
			updateView();
			break;
		case 'ArrowUp':
			texts.selectPrev();
			updateView();
			break;
		case 'ArrowRight':
			texts.selectLast();
			updateView();
			break;
		case 'ArrowDown':
			texts.selectNext();
			updateView();
			break;
		case 'Enter':
			ipcSend({name: 'close', selected: texts.getSelected()});
			break;
		case 'Escape':
			ipcSend({name: 'close'});
			break;
	}
});

let ipcSend = message => ipc.send('window-request', message);

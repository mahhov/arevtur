const path = require('path');
const {app, BrowserWindow} = require('electron');
const {appReadyPromise} = require('js-desktop-base');

let window = appReadyPromise.then(() => {
	let window = new BrowserWindow({
		width: 1800,
		height: 1000,
		show: false,
		webPreferences: {nodeIntegration: true},
	});
	window.setMenu(null);
	window.loadFile(path.resolve(__dirname, 'trade.html'));

	window.on('close', e => {
		e.preventDefault();
		window.hide();
	});

	return window;
});

let showView = async () =>
	(await window).show();

module.exports = {
	trayOptions: [{label: 'Arevtur', click: showView}],
};

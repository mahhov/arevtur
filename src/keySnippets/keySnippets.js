const {ClipboardListener, keyHook, keySender, frontWindowTitle} = require('js-desktop-base');
const ViewHandle = require('./view/ViewHandle');
const {config} = require('../services/config');
const Pricer = require('./Pricer');
const gemQualityArbitrage = require('./gemQualityArbitrage');
const {clipboard: electronClipboard} = require('electron');

let clipboard = new ClipboardListener();
let viewHandle = new ViewHandle();

let slashType = (name = 'hideout') =>
	keySender.strings([keySender.TYPE, '{enter}/' + name + '{enter}']);

let displayGemQualityArbitrage = async () => {
	if (await viewHandle.visible)
		viewHandle.hide();
	else {
		let rows = await gemQualityArbitrage();
		await viewHandle.showTable(rows, 6000);
	}
};

let displayPreferences = async () => {
	if (await viewHandle.visible)
		viewHandle.hide();
	else
		await viewHandle.showPreferences();
};

let priceClipboard = async read => {
	if (!read || !await windowCheck())
		return;
	console.log('clipboard', read);
	let priceLines = await Pricer.getPrice(read);
	console.log('priceLines', priceLines);
	await viewHandle.showTexts(priceLines.map(text => ({text})), 3000);
};

let windowCheck = async () => !config.config.restrictToPoeWindow ||
	(await frontWindowTitle.get()).out.trim() === 'Path of Exile';

let addPoeShortcutListener = (key, handler, ignoreWindow = false) =>
	keyHook.addShortcut('{ctrl}{shift}', key, async () => {
		console.log('Key received', key);
		if (ignoreWindow || await windowCheck())
			handler();
		else
			console.log('POE window not focused.');
	});

let init = () => {
	console.log('init start');
	// todo key sending seems to hang my machine
	// addPoeShortcutListener('h', () => slashType('hideout'));
	// addPoeShortcutListener('k', () => slashType('kingsmarch'));
	keyHook.addShortcut('{ctrl}', 'c', () => priceClipboard(electronClipboard.readText()));
	addPoeShortcutListener('g', displayGemQualityArbitrage);
	addPoeShortcutListener('p', displayPreferences, true);

	setTimeout(() => {
		electronClipboard.clear();
		clipboard.addListener(priceClipboard);
		console.log('clipboard ready');
	}, 500);

	console.log('init done');
};

module.exports = {
	trayOptions: [{label: 'Preferences', click: displayPreferences}],
	init,
};

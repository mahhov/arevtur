const {ClipboardListener, keyHook, keySender, frontWindowTitle} = require('js-desktop-base');
const ViewHandle = require('./view/ViewHandle');
const appData = require('../services/appData');
const Pricer = require('./Pricer');
const unlockCodeFetcher = require('./unlockCodeFetcher');
const cmdUtil = require('./cmdUtil');
const gemQualityArbitrage = require('./gemQualityArbitrage');

let clipboard = new ClipboardListener();
let viewHandle = new ViewHandle();

let startPricer = async () => {
	keySender.string(keySender.RELEASE, '{control}{shift}xc');
	let clipboardInput = await clipboard.copy();
	keySender.string(keySender.PRESS, '{control}{shift}');
	if (await viewHandle.visible && clipboardInput === startPricer.lastClipboardInput)
		viewHandle.hide();
	else {
		startPricer.lastClipboardInput = clipboardInput;
		await viewHandle.showTexts([{text: 'fetching'}], 6000);
		// for whatever reason, when electron tries to resize a window, it releases the shift key.
		keySender.string(keySender.PRESS, '{shift}');
		let priceLines = await Pricer.getPrice(clipboardInput);
		await viewHandle.showTexts(priceLines.map(text => ({text})), 3000);
	}
};

let hideout = () => {
	keySender.strings(
		[keySender.RELEASE, '{control}{shift}h'],
		[keySender.TYPE, '{enter}/hideout{enter}'],
		[keySender.PRESS, '{control}{shift}']);
};

let oos = () => {
	keySender.strings(
		[keySender.RELEASE, '{control}{shift}o'],
		[keySender.TYPE, '{enter}/oos{enter}'],
		[keySender.PRESS, '{control}{shift}']);
};

let unlock = async () => {
	await viewHandle.showTexts([{text: 'fetching'}], 6000);
	let code = await unlockCodeFetcher.fetch();
	viewHandle.hide();
	let uCode = code.toUpperCase();
	keySender.strings(
		[keySender.RELEASE, '{control}{shift}u'],
		[keySender.TYPE, uCode]);
};

let battery = async () => {
	if (await viewHandle.visible)
		viewHandle.hide();
	else {
		let out = await cmdUtil.battery();
		await viewHandle.showTexts([{text: `${out.percent}% [${out.charging ? 'charging' : `${out.minutes} minutes`}]`}], 3000);
	}
};

let networkFlush = async () => {
	if (await viewHandle.visible)
		viewHandle.hide();
	else
		cmdUtil.networkFlush(async out => {
			console.log(out);
			await viewHandle.showTexts(out.map(text => ({text})), 3000);
		});
};

let displayGemQualityArbitrage = async () => {
	if (await viewHandle.visible)
		viewHandle.hide();
	else {
		let lines = await gemQualityArbitrage();
		await viewHandle.showTexts(lines.map(text => ({text})), 6000);
	}
};

let displayPreferences = async () => {
	if (await viewHandle.visible)
		viewHandle.hide();
	else
		await viewHandle.showPreferences();
};

let addPoeShortcutListener = (key, handler) =>
	keyHook.addShortcut('{ctrl}{shift}', key, async () => {
		if (!appData.config.restrictToPoeWindow || (await frontWindowTitle.get()).out.trim() === 'Path of Exile')
			handler();
		else
			console.log('POE window not focused.');
	});

let init = () => {
	addPoeShortcutListener('x', startPricer);
	addPoeShortcutListener('c', startPricer);
	addPoeShortcutListener('h', hideout);
	addPoeShortcutListener('o', oos);
	addPoeShortcutListener('u', unlock);
	addPoeShortcutListener('b', battery);
	// addPoeShortcutListener('n', networkFlush);
	addPoeShortcutListener('g', displayGemQualityArbitrage);
	addPoeShortcutListener('p', displayPreferences);
};

module.exports = {
	trayOptions: [{label: 'Preferences', click: displayPreferences}],
	init,
};

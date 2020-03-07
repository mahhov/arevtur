const path = require('path');
const {TrayHelper, ClipboardListener, keyHook, keySender, frontWindowTitle} = require('js-desktop-base');
const ViewHandle = require('./PoePricerViewHandle');
const Pricer = require('./pricing/Pricer');
const unlockCodeFetcher = require('./unlocker/unlockCodeFetcher');
const cmdUtil = require('./misc/cmdUtil');
const gemQualityArbitrage = require('./misc/gemQualityArbitrage');

let trayIcon = path.join(__dirname, '../../resources/icons/fa-dollar-sign-solid-256.png');
TrayHelper.createExitTray(trayIcon, 'Poe Pricer');
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
		viewHandle.moveToMouse();
		let priceLines = await Pricer.getPrice(clipboardInput);
		viewHandle.showTexts(priceLines.map(text => ({text})), 3000);
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
	viewHandle.moveToMouse();
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
		viewHandle.moveToMouse();
	}
};

let networkFlush = async () => {
	if (await viewHandle.visible)
		viewHandle.hide();
	else
		cmdUtil.networkFlush(async out => {
			console.log(out);
			await viewHandle.showTexts(out.map(text => ({text})), 3000);
			viewHandle.moveToMouse();
		});
};

let displayGemQualityArbitrage = async () => {
	if (await viewHandle.visible)
		viewHandle.hide();
	else {
		let lines = await gemQualityArbitrage();
		await viewHandle.showTexts(lines.map(text => ({text})), 6000);
		viewHandle.moveToMouse();
	}
};

let addPoeShortcutListener = (key, handler) =>
	keyHook.addShortcut('{ctrl}{shift}', key, async () => {
		let title = (await frontWindowTitle.get()).out.trim();
		if (title === 'Path of Exile')
			handler();
		else
			console.log('not path of exile')
	});

addPoeShortcutListener('x', startPricer);
addPoeShortcutListener('c', startPricer);
addPoeShortcutListener('h', hideout);
addPoeShortcutListener('o', oos);
addPoeShortcutListener('u', unlock);
addPoeShortcutListener('b', battery);
addPoeShortcutListener('n', networkFlush);
addPoeShortcutListener('g', displayGemQualityArbitrage);

// todo sizing

const path = require('path');
const {TrayHelper, ClipboardListener, keySender, ShortcutListener, frontWindowTitle} = require('js-desktop-base');
const ViewHandle = require('./PoePricerViewHandle');
const Pricer = require('./pricing/Pricer');
const unlockCodeFetcher = require('./unlocker/unlockCodeFetcher');
const cmdUtil = require('./cmdUtil/cmdUtil');

let trayIcon = path.join(__dirname, '../../resources/icons/fa-dollar-sign-solid-256.png');
TrayHelper.createExitTray(trayIcon, 'Poe Pricer');
let clipboard = new ClipboardListener();
let viewHandle = new ViewHandle();

let lastClipboardInput;

let startPricer = async () => {
	keySender.string(keySender.RELEASE, '{control}{shift}x');
	let clipboardInput = await clipboard.copy();
	keySender.string(keySender.PRESS, '{control}{shift}');
	if (await viewHandle.visible && clipboardInput === lastClipboardInput)
		viewHandle.hide();
	else {
		lastClipboardInput = clipboardInput;
		await viewHandle.showTexts([{text: 'fetching'}], 6000);
		viewHandle.moveToMouse();
		let priceLines = await Pricer.getPrice(clipboardInput);
		viewHandle.showTexts(priceLines.map(a => ({text: a})), 3000);
	}
};

let hideout = () => {
	keySender.strings(
		[keySender.RELEASE, '{control}{shift}h'],
		[keySender.TYPE, '{enter}/hideout{enter}'],
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

let addPoeShortcutListener = (shortcut, handler) =>
	ShortcutListener.add(shortcut, async () => {
		let title = (await frontWindowTitle.get()).out.trim();
		if (title === 'Path of Exile')
			handler();
	});

addPoeShortcutListener('Control+Shift+X', startPricer);
addPoeShortcutListener('Control+Shift+H', hideout);
addPoeShortcutListener('Control+Shift+U', unlock);
addPoeShortcutListener('Control+Shift+B', battery);
addPoeShortcutListener('Control+Shift+N', networkFlush);

// todo sizing

const path = require('path');
const {TrayHelper, ClipboardListener, keySender, ShortcutListener} = require('js-desktop-base');
const ViewHandle = require('./PoePricerViewHandle');
const Pricer = require('./pricing/Pricer');
const unlockCodeFetcher = require('./unlocker/unlockCodeFetcher');
const {getBattery} = require('./battery/battery');

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
		viewHandle.moveToMouse();
		viewHandle.showTexts([{text: 'fetching'}], 6000);
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
	viewHandle.moveToMouse();
	viewHandle.showTexts([{text: 'fetching'}], 6000);
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
		viewHandle.moveToMouse();
		let battery = await getBattery();
		viewHandle.showTexts([{text: `${battery.percent}% [${battery.charging ? 'charging' : `${battery.minutes} minutes`}]`}], 3000);
	}
};

ShortcutListener.add('Control+Shift+X', startPricer);
ShortcutListener.add('Control+Shift+H', hideout);
ShortcutListener.add('Control+Shift+U', unlock);
ShortcutListener.add('Control+Shift+B', battery);

// todo only apply when in appropriate window title
// todo unlock macro
// todo sizing

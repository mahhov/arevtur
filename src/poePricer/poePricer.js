const path = require('path');
const TrayHelper = require('../base/TrayHelper');
const Clipboard = require('../base/Clipboard');
const ViewHandle = require('./PoePricerViewHandle');
const KeySender = require('node-key-sender');
const KeySender2 = require('../base/keySender/keySender');
const ShortcutListener = require('../base/ShortcutListener');
const Pricer = require('./pricing/Pricer');
const unlockCodeFetcher = require('./unlocker/unlockCodeFetcher');

let trayIcon = path.join(__dirname, '../../resources/icons/fa-dollar-sign-solid.png');
TrayHelper.createExitTray(trayIcon, 'Poe Pricer');
let clipboard = new Clipboard();
let viewHandle = new ViewHandle();

// todo extract key stuff

let releaseKeys = keys => {
	KeySender.startBatch();
	keys.forEach(key => KeySender.batchTypeKey(key, 0, KeySender.BATCH_EVENT_KEY_UP));
	KeySender.sendBatch();
};

let typeString = string =>
	KeySender
		.startBatch()
		.batchTypeText(string)
		.sendBatch();

let lastClipboardInput;

let startPricer = async () => {
	releaseKeys(['control', 'shift', 'X']);
	let clipboardInput = await clipboard.copy();
	if (viewHandle.visible && clipboardInput === lastClipboardInput)
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
	releaseKeys(['control', 'shift', 'h']);
	KeySender2('{enter}/hideout{enter}');
};

let unlock = async () => {
	viewHandle.moveToMouse();
	viewHandle.showTexts([{text: 'fetching'}], 6000);
	let code = await unlockCodeFetcher.fetch();
	viewHandle.hide();
	let uCode = code.toUpperCase();
	releaseKeys(['control', 'shift', 'u']);
	typeString(uCode);
};

ShortcutListener.add('Control+Shift+X', startPricer);
ShortcutListener.add('Control+Shift+H', hideout);
ShortcutListener.add('Control+Shift+U', unlock);

// todo must lift ctrl+shift to repress ctrl+shift+x
// todo only apply when in appropriate window title
// todo unlock macro
// todo sizing

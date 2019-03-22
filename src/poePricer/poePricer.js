const path = require('path');
const TrayHelper = require('../base/TrayHelper');
const Clipboard = require('../base/Clipboard');
const ViewHandle = require('./PoePricerViewHandle');
const keySender = require('../base/keySender/keySender');
const ShortcutListener = require('../base/ShortcutListener');
const Pricer = require('./pricing/Pricer');
const unlockCodeFetcher = require('./unlocker/unlockCodeFetcher');

let trayIcon = path.join(__dirname, '../../resources/icons/fa-dollar-sign-solid-256.png');
TrayHelper.createExitTray(trayIcon, 'Poe Pricer');
let clipboard = new Clipboard();
let viewHandle = new ViewHandle();

let lastClipboardInput;

let startPricer = async () => {
	keySender.string(keySender.RELEASE, '{control}{shift}x');
	let clipboardInput = await clipboard.copy();
	keySender.string(keySender.PRESS, '{control}{shift}');
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
		[keySender.TYPE, uCode],
		[keySender.PRESS, '{control}{shift}']);
};

ShortcutListener.add('Control+Shift+X', startPricer);
ShortcutListener.add('Control+Shift+H', hideout);
ShortcutListener.add('Control+Shift+U', unlock);

// todo only apply when in appropriate window title
// todo unlock macro
// todo sizing

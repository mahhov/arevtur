const path = require('path');
const TrayHelper = require('../base/TrayHelper');
const Clipboard = require('../base/Clipboard');
const ViewHandle = require('./PoePricerViewHandle');
const KeySender = require('../base/keySender/keySender');
const ShortcutListener = require('../base/ShortcutListener');
const Pricer = require('./pricing/Pricer');
const unlockCodeFetcher = require('./unlocker/unlockCodeFetcher');

let trayIcon = path.join(__dirname, '../../resources/icons/fa-dollar-sign-solid.png');
TrayHelper.createExitTray(trayIcon, 'Poe Pricer');
let clipboard = new Clipboard();
let viewHandle = new ViewHandle();

let lastClipboardInput;

let startPricer = async () => {
	KeySender.string(KeySender.RELEASE, '{control}{shift}x');
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
	KeySender.string(KeySender.RELEASE, '{control}{shift}h');
	KeySender.string(KeySender.TYPE, '{enter}/hideout{enter}1235-=.,./+-_');
};

let unlock = async () => {
	viewHandle.moveToMouse();
	viewHandle.showTexts([{text: 'fetching'}], 6000);
	let code = await unlockCodeFetcher.fetch();
	viewHandle.hide();
	let uCode = code.toUpperCase();
	KeySender.string(KeySender.RELEASE, '{control}{shift}u');
	KeySender.string(KeySender.TYPE, uCode);
};

ShortcutListener.add('Control+Shift+X', startPricer);
ShortcutListener.add('Control+Shift+H', hideout);
ShortcutListener.add('Control+Shift+U', unlock);

// todo must lift ctrl+shift to repress ctrl+shift+x
// todo only apply when in appropriate window title
// todo unlock macro
// todo sizing

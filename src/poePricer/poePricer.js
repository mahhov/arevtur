const path = require('path');
const TrayHelper = require('../base/TrayHelper');
const Clipboard = require('../base/Clipboard');
const ViewHandle = require('./PoePricerViewHandle');
const KeySender = require('node-key-sender');
const ShortcutListener = require('../base/ShortcutListener');
const Pricer = require('./pricing/Pricer');

let trayIcon = path.join(__dirname, '../../resources/fa-dollar-sign-solid.png');
TrayHelper.createExitTray(trayIcon, 'Poe Pricer');
let clipboard = new Clipboard();
let viewHandle = new ViewHandle();

let startPricer = async () => {
	KeySender
		.startBatch()
		.batchTypeKey('control', 0, KeySender.BATCH_EVENT_KEY_UP)
		.batchTypeKey('shift', 0, KeySender.BATCH_EVENT_KEY_UP)
		.batchTypeKey('x', 0, KeySender.BATCH_EVENT_KEY_UP)
		.sendBatch();
	let clipboardInput = await clipboard.copy();
	let priceLines = await Pricer.getPrice(clipboardInput);
	viewHandle.showTexts(priceLines.map(a => ({text: a})));
};

ShortcutListener.add('Control+Shift+X', startPricer);

// todo non focusable
// todo close after 3 seconds, close  on re-shortcut with same input
// todo only apply when in appropriate window title
// /h for hideout
// unlock macro

const path = require('path');
const TrayHelper = require('../base/TrayHelper');
const Clipboard = require('../base/Clipboard');
const ViewHandle = require('./PoePricerViewHandle');
const KeySender = require('node-key-sender');
const ShortcutListener = require('../base/ShortcutListener');

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
	let copy = await clipboard.copy();
	viewHandle.showTexts(copy.split('\n').map(a => ({text: a})));
};

ShortcutListener.add('Control+Shift+X', startPricer);

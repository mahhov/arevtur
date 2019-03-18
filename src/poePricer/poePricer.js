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

let releaseKeys = keys => {
	KeySender.startBatch();
	keys.forEach(key => KeySender.batchTypeKey(key, 0, KeySender.BATCH_EVENT_KEY_UP));
	KeySender.sendBatch();
};

let lastClipboardInput;

let startPricer = async () => {
	releaseKeys(['control', 'shift', 'X']);
	let clipboardInput = await clipboard.copy();
	if (viewHandle.visible && clipboardInput === lastClipboardInput)
		viewHandle.hide();
	else {
		lastClipboardInput = clipboardInput;
		viewHandle.showTexts([{text: 'fetching'}], 6000);
		let priceLines = await Pricer.getPrice(clipboardInput);
		viewHandle.showTexts(priceLines.map(a => ({text: a})), 3000);
	}
};

let hideout = () => {
	releaseKeys(['control', 'shift', 'h']);
	KeySender.sendKeys(['enter']);
	KeySender.startBatch().batchTypeText('/hideout').sendBatch();
	KeySender.sendKey('enter');
};

ShortcutListener.add('Control+Shift+X', startPricer);
ShortcutListener.add('Control+Shift+H', hideout);

// todo only apply when in appropriate window title
// todo unlock macro
// todo sizing
// todo uniques showing shaper/elder base prices

const path = require('path');
const {app} = require('electron');
const TrayHelper = require('../base/TrayHelper');
const Clipboard = require('../base/Clipboard');
const ViewHandle = require('./ClipboardManagerViewHandle.js');
const ShortcutListener = require('../base/ShortcutListener');

let trayIcon = path.join(__dirname, '../resources/fa-copy-regular.png');
TrayHelper.createExitTray(trayIcon, 'Clipboard');

let viewHandle = new ViewHandle();

// on clipboard change, send new clipboard to view
let clipboard = new Clipboard();
clipboard.addListener(viewHandle.sendText.bind(viewHandle));

// on text select, set clipboard
viewHandle.addSelectListener(Clipboard.write);

// on ctrl shift v, send open
ShortcutListener.add('Control+Shift+V', viewHandle.show.bind(viewHandle));

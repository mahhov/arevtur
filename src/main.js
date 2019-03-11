const {app} = require('electron');
const TrayHelper = require('./TrayHelper');
const Clipboard = require('./Clipboard');
const ViewHandle = require('./ViewHandle');
const ShortcutListener = require('./ShortcutListener');

TrayHelper.createExitTray('resources/fa-copy-regular.png', 'Clipboard');

let viewHandle = new ViewHandle();

// on clipboard change, send text
let clipboard = new Clipboard();
clipboard.addListener(viewHandle.sendText.bind(viewHandle));

// on text select, set clipboard
viewHandle.init(Clipboard.write);

// on ctrl shift v, send open
ShortcutListener.add('Control+Shift+V', viewHandle.show.bind(viewHandle));


const os = require('os');

let osKeySenderName = os.platform() === 'linux' ?
	'./KeySenderLinux' :
	'./KeySenderWindows';

let KeySender = require(osKeySenderName);

module.exports = new KeySender();

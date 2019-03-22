const os = require('os');

let osKeySenderName = os.platform() === 'linux' ?
	'./keySenderLinux' :
	'./keySenderWindows';

module.exports = require(osKeySenderName);

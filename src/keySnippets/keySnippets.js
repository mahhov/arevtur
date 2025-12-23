const ViewHandle = require('./ViewHandle');
const appData = require('../services/appData');

let viewHandle = new ViewHandle();

let displayDevOptions = async () => {
	if (await viewHandle.visible)
		viewHandle.hide();
	else
		await viewHandle.showDevOptions();
};


module.exports = {
	trayOptions: [appData.isDev && {label: 'Dev options', click: displayDevOptions}],
};

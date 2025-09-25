const {keyHook, keySender, frontWindowTitle} = require('js-desktop-base');
const ViewHandle = require('./ViewHandle');
const configForMain = require('../services/config/configForMain');
const Pricer = require('./Pricer');
const Pricer2 = require('./Pricer2');
const gemQualityArbitrage = require('./gemQualityArbitrage');
const {clipboard: electronClipboard} = require('electron');
const pobApi = require('../services/pobApi/pobApi');
const appData = require('../services/appData');
const googleAnalyticsForMain = require('../services/googleAnalytics/googleAnalyticsForMain');

let viewHandle = new ViewHandle();

let displayGemQualityArbitrage = async () => {
	if (await viewHandle.visible)
		viewHandle.hide();
	else {
		let rows = await gemQualityArbitrage();
		googleAnalyticsForMain.emit('gemQualityArbitrageUsed');
		await viewHandle.showTable(rows, 6000);
	}
};

let displayDevOptions = async () => {
	if (await viewHandle.visible)
		viewHandle.hide();
	else
		await viewHandle.showDevOptions();
};


module.exports = {
	trayOptions: [appData.isDev && {label: 'Dev options', click: displayDevOptions}],
};

// todo[medium] a way to restart PoB for clipboard without having to open preferences. maybe set
//  automatic restart count to 1 and do an explicit restart with each request if needed
// todo[medium] estimate price of item mods
// todo[high] a way to disable key snippet

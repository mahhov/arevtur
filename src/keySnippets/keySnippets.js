const {ClipboardListener, keyHook, keySender, frontWindowTitle} = require('js-desktop-base');
const ViewHandle = require('./view/ViewHandle');
const {config} = require('../services/config');
const Pricer = require('./Pricer');
const gemQualityArbitrage = require('./gemQualityArbitrage');
const {clipboard: electronClipboard} = require('electron');
const pobApi = require('../pobApi/pobApi');

let clipboard = new ClipboardListener();
let viewHandle = new ViewHandle();
pobApi.pobPath =
	'/var/lib/flatpak/app/community.pathofbuilding.PathOfBuilding/current/active/files/pathofbuilding/src';
pobApi.build =
	'/home/manukh/.var/app/community.pathofbuilding.PathOfBuilding/data/pobfrontend/Path of Building/Builds/cobra lash.xml';
pobApi.valueParams = {life: .5, resist: .1, dps: .25};

let slashType = (name = 'hideout') =>
	keySender.strings([keySender.TYPE, '{enter}/' + name + '{enter}']);

let displayGemQualityArbitrage = async () => {
	if (await viewHandle.visible)
		viewHandle.hide();
	else {
		let rows = await gemQualityArbitrage();
		await viewHandle.showTable(rows, 6000);
	}
};

let displayPreferences = async () => {
	if (await viewHandle.visible)
		viewHandle.hide();
	else
		await viewHandle.showPreferences();
};

let priceClipboard = async itemText => {
	if (!itemText || !await windowCheck())
		return;
	console.log('clipboard', itemText);
	let pricerOutput = Pricer.getPrice(itemText).catch(e => []);
	let pobOutput = pobApi.evalItem(itemText).catch(e => []);
	[pricerOutput, pobOutput] = await Promise.all([pricerOutput, pobOutput]);
	console.log('pricerOutput', pricerOutput, '\n', 'pobOutput', pobOutput);
	await viewHandle.showTexts([
		...pricerOutput,
		'-'.repeat(30),
		pobOutput.value,
		...pobOutput.text.split('\n'),
	].map(text => ({text})), 3000);
};

let windowCheck = async () => !config.config.restrictToPoeWindow ||
	(await frontWindowTitle.get()).out.trim() === 'Path of Exile';

let addPoeShortcutListener = (key, handler, ignoreWindow = false) =>
	keyHook.addShortcut('{ctrl}{shift}', key, async () => {
		console.log('Key received', key);
		if (ignoreWindow || await windowCheck())
			handler();
		else
			console.log('POE window not focused.');
	});

let init = () => {
	console.log('init start');
	// todo key sending seems to hang my machine
	// addPoeShortcutListener('h', () => slashType('hideout'));
	// addPoeShortcutListener('k', () => slashType('kingsmarch'));
	keyHook.addShortcut('{ctrl}', 'c', () => priceClipboard(electronClipboard.readText()));
	addPoeShortcutListener('g', displayGemQualityArbitrage);
	addPoeShortcutListener('p', displayPreferences, true);

	setTimeout(() => {
		electronClipboard.clear();
		clipboard.addListener(priceClipboard);
		console.log('clipboard ready');
	}, 500);

	console.log('init done');
};

module.exports = {
	trayOptions: [{label: 'Preferences', click: displayPreferences}],
	init,
};

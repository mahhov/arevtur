// FRONT WINDOW

// const {frontWindowTitle} = require('js-desktop-base');
//
// setInterval(async () => {
// 	console.log('x', (await frontWindowTitle.get()).out.trim());
// }, 500);

// CLIPBOARD

// const {clipboard} = require('electron');
// let x = () => {
// 	let lastRead = clipboard.readText();
// 	setInterval(async () => {
// 		let read = clipboard.readText();
// 		if (read === lastRead)
// 			return;
// 		lastRead = read;
// 	}, 100);
// };
// setTimeout(x, 1000);

// const {clipboard} = require('electron');
// let lastRead = '';
// setInterval(async () => {
// 	let read = clipboard.readText();
// 	if (read === lastRead)
// 		return;
// 	lastRead = read;
// 	console.log('change', read);
// }, 100);

const {ClipboardListener} = require('js-desktop-base');
let clipboard = new ClipboardListener();
clipboard.addListener(async read => {
    if (!read)
        return;
    console.log('clipboard', read)
});

// SCREEN

// const screen = require('electron').screen;
// setTimeout(() => {
// 	setInterval(async () => {
// 		console.log((await screen).getCursorScreenPoint());
// 	}, 500);
// }, 1500);

// SLASH TYPE

// setInterval(() => {
// 	keySender.strings(
// 		[keySender.PRESS, '{control}{shift}'],
// 		[keySender.RELEASE, '{control}{shift}'],
// 		[keySender.TYPE, '{enter}/' + 'hideout' + '{enter}']);
// }, 2000)

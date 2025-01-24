const fs = require('fs');
const {Notification} = require('electron');
const configForMain = require('../services/config/configForMain');

// todo[low] configurable path
const clientPath = 'C:\\Program Files (x86)\\Grinding Gear Games\\Path of Exile 2\\logs\\Client.txt';

let readLines = 0;
let getUnreadLines = async () => {
	let buffer = await fs.promises.readFile(clientPath);
	let lines = buffer.toString().split('\n').filter(v => v);

	let oldReadLines = readLines;
	readLines = lines.length;
	return lines
		.slice(oldReadLines)
		.map(line => line.match(/\d{4}\/\d{2}\/\d{2} (\d{2}:\d{2}:\d{2}) \d+ \w+ \[\w+ \w+ \d+] (@From|@To|:|%\w+:|@\w+:)(.*)/))
		.filter(match => match)
		.map(match => `${match[1]}${match[2]}${match[3]}`);
};

setTimeout(async () => {
	await getUnreadLines();
	fs.watchFile(clientPath, async () => {
		if (!configForMain.config.chatNotifications)
			return;
		let text = (await getUnreadLines()).join('\n');
		if (!text)
			return;
		console.log(text);
		new Notification({
			title: '',
			body: text,
		}).show();
	});
}, 2500);

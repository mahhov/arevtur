const {clipboard} = require('electron');
const KeySender = require('node-key-sender');

class ClipboardListener {
	addListener(listener) {
		this.listener = listener;

		let lastRead = null;
		setInterval(() => {
			let read = clipboard.readText();
			if (read === lastRead)
				return;
			listener(read);
			lastRead = read;
		}, 100);
	}

	static write(value) {
		clipboard.writeText(value);
		KeySender.sendCombination(['control', 'v']);
	}
}

module.exports = ClipboardListener;

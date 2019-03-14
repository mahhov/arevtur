const {clipboard} = require('electron');
const KeySender = require('node-key-sender');
const XPromise = require('./XPromise');

class ClipboardListener {
	nextProimses = [];

	addListener(listener) {
		this.listener = listener;

		let lastRead = null;
		setInterval(() => {
			let read = clipboard.readText();
			if (read === lastRead)
				return;
			this.nextProimses.forEach(promise => promise.resolve(read));
			this.nextProimses = [];
			listener(read);
			lastRead = read;
		}, 100);
	}

	getNext() {
		let promise = new XPromise();
		this.nextProimses.push(promise);
		return promise;
	}

	static write(value) {
		clipboard.writeText(value);
		KeySender.sendCombination(['control', 'v']);
	}
}

module.exports = ClipboardListener;

const {clipboard} = require('electron');
const KeySender = require('node-key-sender');
const XPromise = require('./XPromise');

class ClipboardListener {
	listeners = [];
	nextPromises = [];

	constructor() {
		let lastRead = null;
		setInterval(() => {
			let read = clipboard.readText();
			if (read === lastRead)
				return;
			lastRead = read;
			this.listeners.forEach(listener => listener(read));
			this.nextPromises.forEach(promise => promise.resolve(read));
			this.nextPromises = [];
		}, 100);
	}

	addListener(listener) {
		this.listeners.push(listener);
	}

	getNext() {
		let promise = new XPromise();
		this.nextPromises.push(promise);
		return promise;
	}

	copy() {
		let next = this.getNext();
		KeySender.sendCombination(['control', 'c']);
		return next;
	}

	static paste(value) {
		clipboard.writeText(value);
		KeySender.sendCombination(['control', 'v']);
	}
}

module.exports = ClipboardListener;

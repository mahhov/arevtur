const {clipboard} = require('electron');
// const KeySender = require('node-key-sender'); todo
const XPromise = require('./XPromise');

class ClipboardListener {
	listeners = [];
	nextPromises = [];

	constructor() {
		this.lastRead = null;
		setInterval(() => {
			let read = clipboard.readText();
			if (read === this.lastRead)
				return;
			this.lastRead = read;
			this.listeners.forEach(listener => listener(read));
			this.nextPromises.forEach(promise => promise.resolve(read));
			this.nextPromises = [];
		}, 100);
	}

	addListener(listener) {
		this.listeners.push(listener);
	}

	getNext() {
		clipboard.clear();
		this.lastRead = '';
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

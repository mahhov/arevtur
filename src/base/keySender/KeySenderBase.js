// SHARED BY LINUX & WINDOWS
class KeySenderBase {
	RELEASE = -1;
	PRESS = -2;
	TYPE = -3;
	COMBO = -4;

	constructor() {
		this.process = this.initProcess();
		this.keyMap = this.createKeyMap();
	}

	async initProcess() {
		let process = await this.spawnProcess();
		process.stdout.on('data', data => console.log('keySender process output:', data.toString()));
		process.stderr.on('data', data => console.error('keySender process error:', data.toString()));
		return process;
	}

	async spawnProcess() {
		/* override */
	}

	async send(arg) {
		(await this.process).stdin.write(arg + '\n');
	}

	createKeyMap() {
		/* override */
	}

	stringToKeys(string) {
		return string
			.match(/[^{}]|{\w+}/g)
			.map(c => c.toUpperCase())
			.map(c => this.keyMap[c])
			.filter(a => a);
	}

	string(action, string) {
		this.raw(action, this.stringToKeys(string));
	}

	// KeySender.strings(
	// 	 [KeySender.RELEASE, '{control}{shift}x'],
	// 	 [KeySender.COMBO, '{control}c']);
	strings(...actionStringPairs) {
		this.send(actionStringPairs
			.reduce((prev, [action, string]) =>
				[...prev, action, ...this.stringToKeys(string)], []));
	}

	raw(action, keys) {
		this.send([action, ...keys])
	}
}

module.exports = KeySenderBase;

// todo extract duplicate code with frontWindowTitle to powerShellExecutor

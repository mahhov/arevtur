class Emitter {
	listeners = {};

	addListener(event, handler) {
		this.listeners[event] ||= [];
		this.listeners[event].push(handler);
	}

	emit(event, ...args) {
		this.listeners[event]?.forEach(handler => handler(...args));
	}

	clearListeners() {
		this.listeners = {};
	}
}

module.exports = Emitter;

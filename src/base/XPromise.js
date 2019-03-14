class XPromise {
	constructor() {
		let resolve, reject;
		let promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});
		promise.resolve = resolve;
		promise.reject = reject;
		return promise;
	}
}

module.exports = XPromise;

const appReadyPromise = require('./appReadyPromise');
const {net} = require('electron');
const XPromise = require('./XPromise');

let get = async endpoint => {
	await appReadyPromise;
  let promise = new XPromise();
	let request = net.request(endpoint);
  let responseChunks = [];
	request.on('response', response => {
		response.setEncoding('utf8');
		response.on('data', chunk => responseChunks.push(chunk));
		response.on('end', () => {
			let body = responseChunks.join('');
			try {
				promise.resolve(JSON.parse(body));
			} catch (e) {
				promise.reject(e);
			}
		});
	  response.on('error', e => promise.reject(e));
	})
	request.end();
  return promise;
};

module.exports = get;

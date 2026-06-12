/*
	{
	  response {},
	  errors: [],
	  string: '',
	}
*/
let handleResponse = async response => {
	let ret = {
		response,
		errors: [],
	};
	try {
		ret.string = await response.text();
	} catch (e) {
		ret.errors.push('failed to parse body');
		ret.errors.push(e);
		throw ret;
	}
	if (!response.ok) {
		ret.errors.push('bad status code');
		ret.errors.push(response.statusCode);
		ret.errors.push(response.status);
		throw ret;
	}
	return ret;
};

let get = async (endpoint, queryParams = {}, headers = {}) => {
	try {
		let queryString = new URLSearchParams(queryParams).toString();
		let url = queryString ? `${endpoint}?${queryString}` : endpoint;
		let response = await fetch(url, {
			method: 'GET',
			headers,
		});
		return await handleResponse(response);
	} catch (error) {
		throw error;
	}
};

let post = async (endpoint, body = {}, headers = {}) => {
	try {
		let response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...headers,
			},
			body: JSON.stringify(body),
		});
		return await handleResponse(response);
	} catch (error) {
		throw error;
	}
};

let post2 = async (endpoint, queryParams = {}, body = {}, headers = {}) => {
	try {
		let queryString = new URLSearchParams(queryParams).toString();
		let url = queryString ? `${endpoint}?${queryString}` : endpoint;
		let response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...headers,
			},
			body: JSON.stringify(body),
		});
		return await handleResponse(response);
	} catch (error) {
		throw error;
	}
};

module.exports = {get, post, post2};

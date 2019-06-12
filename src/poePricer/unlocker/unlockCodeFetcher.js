const fs = require('fs').promises;
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const CREDENTIAL_PATH = './resources/config/gmailCredentials.json';
const TOKEN_PATH = './resources/config/gmailToken.json';

// orchestrating functions

let refreshToken = async () => {
	try {
		let auth = await createAuthClient();
		if (!await needsNewToken(auth)) return;
		let newToken = await getNewToken(auth);
		await fs.writeFile(TOKEN_PATH, JSON.stringify(newToken));
		console.log('Token stored to', TOKEN_PATH);
	} catch (e) {
		console.log('error:', e);
	}
};

let fetch = async () => {
	try {
		let auth = await createAuthClient();
		let gmail = await createGmailClient(auth);
		let emailId = await getLastPoeEmail(gmail);
		let emailBody = await getEmail(gmail, emailId);
		return extractPoeCode(emailBody);
	} catch (e) {
		console.log('ERROR:', e);
		return e;
	}
};

let needsNewToken = async auth => {
	try {
		let gmail = await createGmailClient(auth);
		let emailId = await getLastPoeEmail(gmail);
		console.log('no new token needed:', emailId);
		return false;
	} catch (e) {
		console.log('needs new token:', e.errors);
		return true;
	}
};

// factory methods for google api

let createAuthClient = async () => {
	try {
		let credentialsRaw = await fs.readFile(CREDENTIAL_PATH);
		let credentials = JSON.parse(credentialsRaw);
		let {client_secret, client_id, redirect_uris} = credentials.installed;
		return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
	} catch (e) {
		console.log('error creating auth client:', e);
	}
};

let createGmailClient = async auth => {
	try {
		let token = await fs.readFile(TOKEN_PATH);
		auth.setCredentials(JSON.parse(token));
		return google.gmail({version: 'v1', auth});
	} catch (e) {
		console.log('error creating gmail client:', e)
	}
};

// prompt user for token

let getNewToken = async auth => {
	let promise = new PromiseX();
	const authUrl = auth.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
	});
	console.log('Authorize this app by visiting this url:', authUrl);
	prompt('Enter the code from that page here: ').then(code => {
		auth.getToken(code, (err, token) => {
			if (err) {
				promise.reject();
				return console.error('Error retrieving access token', err);
			}
			promise.resolve(token);
		});
	});
	return promise;
};

let prompt = promptString => {
	let promise = new PromiseX();
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	rl.question(promptString, response => {
		rl.close();
		promise.resolve(response);
	});
	return promise;
};

class PromiseX {
	constructor() {
		let promiseX;
		let promise = new Promise((resolve, reject) => {
			promiseX = {resolve, reject};
		});
		return Object.assign(promise, promiseX);
	}
}

// reading and parsing email

let getLastPoeEmail = gmail => {
	let promise = new PromiseX();
	gmail.users.messages.list({
		userId: 'me',
		maxResults: 1,
		q: 'path of exile'
	}, (error, response) =>
		error ? promise.reject(error) : promise.resolve(response.data.messages[0].id));
	return promise;
};

let getEmail = (gmail, emailId) => {
	let promise = new PromiseX();
	gmail.users.messages.get({
		userId: 'me',
		id: emailId
	}, (error, response) =>
		error ? promise.reject(error) : promise.resolve(decode64(response.data.payload.body.data)));
	return promise;
};

let extractPoeCode = emailBody =>
	emailBody.match(/after logging in:\n\n(.*)/)[1];

let decode64 = encoded64 =>
	Buffer.from(encoded64, 'base64').toString();

module.exports = {refreshToken, fetch};

// todo return to stable electron version to avoid crash when making http request

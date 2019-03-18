// WINDOWS ONLY

const path = require('path');
const {exec} = require("child_process");

let keySender = keys =>
	new Promise((resolve, reject) =>
		exec(`powershell.exe ${path.join(__dirname, './keySender.ps1')} '${keys}'`, {},
			(err, out) => err ? reject(err) : resolve(out)));

module.exports = keySender;

// todo extract duplicate code with frontWindowTitle to powerShellExecutor

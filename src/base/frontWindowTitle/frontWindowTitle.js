// WINDOWS ONLY

const path = require('path');
const {exec} = require("child_process");

let frontWindowTitle = () =>
	new Promise((resolve, reject) =>
		exec(`powershell.exe ${path.join(__dirname, './frontWindowTitle.ps1')}`, {},
			(err, out) => err ? reject(err) : resolve(out)));

module.exports = frontWindowTitle;

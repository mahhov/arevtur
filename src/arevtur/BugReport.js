const configForRenderer = require('../services/config/configForRenderer');
const {promises: fs} = require('fs');
const logging = require('../services/logging');
const appData = require('../services/appData');
const {openPath} = require('../util/util');
const os = require('os');
const packageJson = require('../../package.json');

class BugReport {
	constructor(data) {
		delete data?.config?.sessionId;
		this.data = data;
	}

	static async fromDownload(reportString) {
		if (!reportString) return null;
		let data;
		try {
			data = JSON.parse(reportString);
		} catch (e) {
			console.error('BugReport, failed to parse bugReport.json:', e);
			return null;
		}
		delete data?.config?.sessionId;
		delete data?.config?.buildParams?.pobPath;
		return new BugReport(data);
	}

	static async fromCurrentState() {
		return new BugReport({
			os: os.platform(),
			version: packageJson.version,
			config: configForRenderer.config,
			local: localStorage,
			build: await fs.readFile(configForRenderer.config.buildParams.buildPath)
				.then(r => r.toString())
				.catch(e => e),
			logs: logging.logs,
		});
	}

	async toCurrentState() {
		await fs.writeFile(appData.bugReportBuildPath, this.data.build)
			.catch(e => console.error('BugReport, failed to write bugReportBuild.xml:', e));
		if (this.data?.config?.buildParams?.buildPath)
			this.data.config.buildParams.buildPath = appData.bugReportBuildPath;
		configForRenderer.config = this.data.config;
		Object.assign(localStorage, this.data.local);
		sessionStorage.setItem('activeBugReport', JSON.stringify(this.data));
		window.location.reload();
	}

	async toDownload() {
		let string = JSON.stringify(this.data, null, 2);
		fs.writeFile(appData.bugReportPath, string)
			.then(() => openPath(appData.bugReportPath, true))
			.catch(e => console.error('BugReport, failed to write to bugReport.json:', e));
	}
}

let activeBugReportString = sessionStorage.getItem('activeBugReport');
if (activeBugReportString) {
	let activeBugReport = JSON.parse(activeBugReportString);
	console.log('BugReport:', activeBugReport.os, activeBugReport.version);
	console.log('BugReport logs:', activeBugReport.logs);
	sessionStorage.removeItem('activeBugReport');
}

module.exports = BugReport;

// todo[high] surface errors to the user, clean up consoles messages

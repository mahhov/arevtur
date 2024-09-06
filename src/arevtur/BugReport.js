const {configForRenderer} = require('../services/config/configForRenderer');
const {promises: fs} = require('fs');
const logging = require('../services/logging');
const appData = require('../services/appData');
const {openPath} = require('../util/util');

class BugReport {
	constructor(data) {
		this.data = data;
	}

	static async fromDownload(path) {
		let reportString = await fs.readFile(path)
			.then(r => r.toString())
			.catch(e => console.warn('BugReport, failed to read bugReport.json:', e));
		if (!reportString) return null;
		let data;
		try {
			data = JSON.parse(reportString);
		} catch (e) {
			console.error('BugReport, failed to parse bugReport.json:', e);
			return null;
		}
		delete data?.local['input-session-id'];
		delete data?.config?.buildParams?.pobPath;
		return new BugReport(data);
	}

	static async fromCurrentState() {
		return new BugReport({
			config: configForRenderer.config,
			local: {...localStorage, 'input-session-id': 'redacted'},
			build: await fs.readFile(configForRenderer.config.buildParams.buildPath)
				.then(r => r.toString())
				.catch(e => e),
			logs: logging.logs,
		});
		// todo[medium] include version/os info
	}

	async toCurrentState() {
		await fs.writeFile(appData.bugReportBuildPath, this.data.build)
			.catch(e => console.error('BugReport, failed to write bugReportBuild.xml:', e));
		if (this.data?.config?.buildParams?.buildPath)
			this.data.config.buildParams.buildPath = appData.bugReportBuildPath;
		configForRenderer.config = this.data.config;
		Object.assign(localStorage, this.data.local);
		sessionStorage.setItem('bugReportLogs', JSON.stringify(this.data.logs));
		window.location.reload();
	}

	async toDownload() {
		let string = JSON.stringify(this.data, null, 2);
		fs.writeFile(appData.bugReportPath, string)
			.then(() => openPath(appData.bugReportPath, true))
			.catch(e => console.error('BugReport, failed to write to bugReport.json:', e));
	}
}

let logs = sessionStorage.getItem('bugReportLogs');
if (logs) {
	console.log('BugReport logs:', JSON.parse(logs));
	sessionStorage.removeItem('bugReportLogs');
}

module.exports = BugReport;

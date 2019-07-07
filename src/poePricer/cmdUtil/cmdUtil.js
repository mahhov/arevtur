const {promisify} = require('util');
const childProcess = require('child_process');
const exec = promisify(childProcess.exec);

let battery = async () => {
	let batteryOut = (await exec('wmic path Win32_Battery get EstimatedChargeRemaining, EstimatedRunTime, BatteryStatus '))
		.stdout
		.split(/\s+/);
	let parsed = {};
	let propCount = Math.floor(batteryOut.length / 2);
	for (let i = 0; i < propCount; i++)
		parsed[batteryOut[i]] = batteryOut[i + propCount];
	return {
		charging: parsed.BatteryStatus === '2',
		percent: parsed.EstimatedChargeRemaining,
		minutes: parsed.EstimatedRunTime,
	};
};

networkFlush = async callback => {
	let cmds = [
		'ipconfig /flushdns',
		'ipconfig /registerdns',
		'ipconfig /release',
		'ipconfig /renew',
		'netsh winsock reset',
	];
	for (i in cmds) {
		let success, outObj;
		try {
			success = true;
			outObj = await exec(cmds[i])
		} catch (e) {
			outObj = e;
		}
		callback([
			`${parseInt(i) + 1} of ${cmds.length}`,
			cmds[i],
			success ? '--SUCCEEDED' : '--FAILED--',
			...outObj.stdout.split(/([\r\n])+/),
			...outObj.stderr.split(/([\r\n])+/),
		]);
	}
};

module.exports = {battery, networkFlush};

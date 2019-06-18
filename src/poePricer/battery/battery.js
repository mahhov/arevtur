const {promisify} = require('util');
const childProcess = require('child_process');
const exec = promisify(childProcess.exec);

let getBattery = async () => {
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

module.exports = {getBattery};

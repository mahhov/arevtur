const {shell} = require('electron');
const path = require('path');

let minIndex = array => array.indexOf(Math.min(...array));
let maxIndex = array => array.indexOf(Math.max(...array));
let clamp = (value, min, max) => Math.min(Math.max(value, min), max);
let transpose = a => a[0].map((_, i) => a.map(v => v[i]));
let unique = (v, i, a) => a.indexOf(v) === i;
let randInt = n => Math.floor(Math.random() * n);
let randId = () => randInt(1000 ** 2) + 1;
let round = (n, precision) => Math.round(n * 10 ** precision) / 10 ** precision;
let escapeRegex = stringRegex => stringRegex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // https://stackoverflow.com/a/6969486/6951428
let sleep = ms => ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve();

let deepMerge = (target, source) => {
	if (typeof source !== 'object' || source === null)
		return source;
	if (Array.isArray(source)) {
		if (!Array.isArray(target))
			target = [];
		source.forEach((v, i) => target[i] = deepMerge(target[i], v));
		target.splice(source.length);
		return target;
	}
	if (typeof target !== 'object' || Array.isArray(target))
		target = {};
	Object.entries(source).forEach(([k, v]) => target[k] = deepMerge(target[k], v));
	return target;
};

let deepCopy = obj => {
	if (typeof obj !== 'object' || obj === null)
		return obj;
	if (Array.isArray(obj))
		return obj.map(v => deepCopy(v));
	return Object.fromEntries(Object.entries(obj)
		.map(([k, v]) => [k, deepCopy(v)]));
};

let flattenObject = (obj, separator = '_') => {
	if (typeof obj !== 'object' || obj === null)
		return obj;
	return Object.entries(obj).reduce((flatObj, [key, value]) => {
		value = flattenObject(value);
		if (typeof value !== 'object' || value === null)
			flatObj[key] = value;
		else
			Object.entries(value).forEach(([key2, value]) => {
				flatObj[`${key}${separator}${key2}`] = value;
			});
		return flatObj;
	}, {});
};

let deepEquality = (obj1, obj2) =>
	JSON.stringify(obj1) === JSON.stringify(obj2);

let openPath = (path, isFile = false) => {
	if (isFile)
		shell.showItemInFolder(path);
	else
		shell.openPath(path);
};

// todo[low] use this instead of `clearChildren()` and re-creating elements
let updateElementChildren = (parentEl, values, creator, updater) => {
	while (parentEl.children.length < values.length)
		parentEl.appendChild(creator(parentEl.children.length, values));
	while (parentEl.children.length > values.length)
		parentEl.removeChild(parentEl.lastChild);
	values.forEach((value, i) => updater(parentEl.children[i], i, value));
};

module.exports = {
	minIndex,
	maxIndex,
	clamp,
	transpose,
	unique,
	randInt,
	randId,
	round,
	escapeRegex,
	sleep,

	deepMerge,
	deepCopy,
	flattenObject,
	deepEquality,

	openPath,
	iconPath: path.join(__dirname, '../../resources/icon.png'),

	updateElementChildren,

	// todo[low] move un-classed & static methods like decode64 here
	//  (const|let) \w+ = (\w+|\([^)]*\)) =>
};

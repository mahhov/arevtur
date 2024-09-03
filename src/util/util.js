let deepMerge = (target, source) => {
	if (typeof source !== 'object' || source === null)
		return source;
	if (Array.isArray(source)) {
		if (!Array.isArray(target))
			target = [];
		source.forEach((v, i) => target[i] = deepMerge(target[i], v));
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

let randInt = n => Math.floor(Math.random() * n);

module.exports = {
	minIndex: array => array.indexOf(Math.min(...array)),
	maxIndex: array => array.indexOf(Math.max(...array)),
	clamp: (value, min, max) => Math.min(Math.max(value, min), max),
	deepMerge,
	deepCopy,
	flattenObject,
	deepEquality,
	transpose: a => a[0].map((_, i) => a.map(v => v[i])),
	randInt,
	// todo[low] move un-classed & static methods like decode64 here
};

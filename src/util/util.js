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

module.exports = {
	minIndex: array => array.indexOf(Math.min(...array)),
	maxIndex: array => array.indexOf(Math.max(...array)),
	clamp: (value, min, max) => Math.min(Math.max(value, min), max),
	deepMerge,
	transpose: a => a[0].map((_, i) => a.map(v => v[i])),
	// todo[low] move un-classed methods like deepCopy and static methods like decode64 here
};

module.exports = {
	minIndex: array => array.indexOf(Math.min(...array)),
	clamp: (value, min, max) => Math.min(Math.max(value, min), max),
};

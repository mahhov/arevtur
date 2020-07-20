const ItemEval = require('./ItemEval');

class ItemEvalCache {
	constructor() {
		this.cache = {};
		this.last = null; // public
	}

	getFromPobPath(pobPath) {
		this.last?.exit();
		return this.last = this.cache[pobPath] = this.cache[pobPath] || new ItemEval(pobPath);
	}
}

module.exports = {itemEvalCache: new ItemEvalCache()};

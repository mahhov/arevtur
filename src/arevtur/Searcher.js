const assert = require('assert');

class Searcher {
	constructor(searchText) {
		this.terms = searchText
			.toLowerCase()
			.split(/\s+/)
			.filter(v => v)
			.map(word => word.startsWith('!') ? [word.slice(1), false] : [word, true]);
	}

	test(string) {
		string = string.toLowerCase();
		return this.terms.every(([word, include]) =>
			string.includes(word) === include);
	}

	testMulti(strings) {
		strings = strings.map(string => string.toLowerCase());
		return this.terms.every(([word, include]) =>
			strings.some(string => string.includes(word)) === include);
	}
}

let searcher = new Searcher('cOld rEs % !fIR');
assert(searcher.test('+5% cold resistance'));
assert(searcher.test('+5% cold and lightning resistance'));
assert(!searcher.test('+5% cold and fire resistance'));
assert(!searcher.test('lots of cold resistance'));

module.exports = Searcher;

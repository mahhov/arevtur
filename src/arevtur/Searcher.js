class Searcher {
	constructor(searchText) {
		this.terms = searchText
			.split(/\s+/)
			.map(word => word.startsWith('!') ? [word, false] : [word, true]);
	}

	test(string) {
		return this.terms.every(([word, include]) =>
			string.includes(word) === include);
	}

	testMulti(strings) {
		return this.terms.every(([word, include]) =>
			strings.some(string => string.includes(word)) === include);
	}
}

module.exports = Searcher;

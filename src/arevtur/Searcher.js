class Searcher {
	constructor(searchText, preserveOrder = true) {
		this.searchRegexes = preserveOrder ?
			Searcher.createSearchRegexesWithOrder(searchText) :
			Searcher.createSearchRegexesWithoutOrder(searchText);
	}

	static escapeRegexSymbols(str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$1');
	}

	static createSearchRegexesWithOrder(searchText) {
		let searchRegexString =
			Searcher.escapeRegexSymbols(searchText)
				.replace(/\s+/g, '(.* )?');
		return [new RegExp(searchRegexString, 'i')];
	}

	static createSearchRegexesWithoutOrder(searchText) {
		return Searcher.escapeRegexSymbols(searchText)
			.split(/\s+/g)
			.map(regexString => new RegExp(regexString, 'i'))
	}

	test(string) {
		return this.searchRegexes.every(regex => regex.test(string));
	}
}

module.exports = Searcher;

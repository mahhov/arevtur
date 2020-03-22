class Searcher {
	constructor(searchText, preserveOrder = true, not = false) {
		this.searchRegexes = preserveOrder ?
			Searcher.createSearchRegexesWithOrder(searchText) :
			Searcher.createSearchRegexesWithoutOrder(searchText);
		this.not = not;
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
		return this.searchRegexes.every(regex => regex.test(string)) ^ this.not;
	}
}

module.exports = Searcher;

class Searcher {
	// E.g. small 'cat' | kitten, brown fur, !fat | ugly
	// Terminology:
	//   phrase: 'small', 'cat', 'kitten' ....
	//   or: "small 'cat'", 'kitten'
	//   segment: "small 'cat' | kitten'
	// When preserveOrder is true, 'brown ... fur' must be present; otherwise, 'fur ... brown' will also suffice.
	// Order of operations: , ! | <space> '
	// Doesn't support escaping these operators. E.g. searching for a comma or quoted text.
	constructor(searchText, preserveOrder = true) {
		this.segments = searchText
			.replace(/([.*+?^${}()[\]\\])/g, '\\$1') // doesn't replace '|'
			.replace(/'+/g, '\\b')
			.split(',')
			.map(segment => {
				segment = segment.trim();
				let not = segment.startsWith('!');
				if (not)
					segment = segment.substring(1);
				let ors = segment
					.split('|')
					.map(or =>
						(preserveOrder ? [or.replace(/\s+/g, '(.* )?')] : or.split(/\s+/g))
							.map(regexString => new RegExp(regexString, 'i')));
				return {not, ors};
			});
	}

	test(strings) {
		return this.segments.every(segment =>
			segment.not ^ segment.ors.some(phrase =>
				strings.some(string =>
					phrase.every(regex =>
						regex.test(string)))));
	}
}

// Test
let testSearcher = new Searcher('small \'cat\' | kitten, brown fur, !fat | ugly');
[
	[testSearcher.test(['brown fur', 'kittens', '']), true],
	[testSearcher.test(['brown fur', 'veryugly', 'kittens', '']), false],
	[testSearcher.test(['brown fur', 'cats', '']), false],
	[testSearcher.test(['fur brown', 'kittens', '']), false],
	[testSearcher.test(['fur brown', '', '']), false],
	[testSearcher.test(['brown', 'kittens', 'fur']), false],
].forEach(([a, b], i) => a !== b && console.log('Failed testSearcher test case', i));

let testSearcherNoOrder = new Searcher('small \'cat\' | kitten, brown fur, !fat | ugly', false);
[
	[testSearcherNoOrder.test(['brown fur', 'kittens', '']), true],
	[testSearcherNoOrder.test(['brown fur', 'veryugly', 'kittens', '']), false],
	[testSearcherNoOrder.test(['brown fur', 'cats', '']), false],
	[testSearcherNoOrder.test(['fur brown', 'kittens', '']), true],
	[testSearcherNoOrder.test(['fur brown', '', '']), false],
	[testSearcherNoOrder.test(['brown', 'kittens', 'fur']), false],
].forEach(([a, b], i) => a !== b && console.log('Failed testSearcherNoOrder test case', i));

module.exports = Searcher;

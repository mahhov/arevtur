const assert = require('assert');

// case insensitive
// not necessarily at a word boundary
// not necessarily in order
// 'x y' means 'x' and 'y' must be contained in 'string'
// 'x !y' means 'x' must be contained in 'string', but 'y' must not be
// 'x = y' means 'x' must be contained in 'string', and string must only consist of 'x' and 'y'
class Searcher {
	constructor(searchText) {
		this.requiredWords = [];
		this.allowedWords = [];
		this.unallowedWords = [];

		let equalEncountered = false;
		searchText
			.toLowerCase()
			.split(/\s+/)
			.filter(v => v)
			.forEach(word => {
				if (word === '=') {
					equalEncountered = true;
					return;
				}
				if (equalEncountered)
					this.allowedWords.push(word);
				else if (word.startsWith('!'))
					this.unallowedWords.push(word.slice(1));
				else
					this.requiredWords.push(word);
			});
		if (this.allowedWords.length)
			this.allowedWords.push(...this.requiredWords);
	}

	test(string) {
		string = string.toLowerCase();
		return (
			this.requiredWords.every(word => string.includes(word)) &&
			(!this.allowedWords.length || string
				.split(/\s+/)
				.filter(v => v)
				.every(stringWord => this.allowedWords.includes(stringWord))) &&
			this.unallowedWords.every(word => !string.includes(word))
		);
	}

	testMulti(strings) {
		return this.test(strings.join(' '));
	}
}

let searcher = new Searcher('cOld rEs % !fIR');
assert(searcher.test('+5% cold resistance'));
assert(searcher.test('+5% cold and lightning resistance'));
assert(!searcher.test('+5% cold and fire resistance'));
assert(!searcher.test('lots of cold resistance'));
searcher = new Searcher('cold = resist fire');
assert(searcher.test('cold resist'));
assert(!searcher.test('fire resist'));
assert(searcher.test('cold fire resist'));
assert(!searcher.test('cold fire lightning resist'));

module.exports = Searcher;

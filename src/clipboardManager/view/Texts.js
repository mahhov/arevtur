const SELECTED_TEXT_COLOR = '#fff';
const SELECTED_BG_COLOR = '#646496';

class Texts {
	constructor(size, previewSize) {
		this.size = size;
		this.previewSize = previewSize;
		this.texts = [];
		this.selected = 0;
	}

	addFront(text) {
		let index = this.texts.indexOf(text);
		if (index !== -1)
			this.remove(index);
		this.texts.unshift(text);
		if (this.texts.length > this.size)
			this.texts.pop();
	}

	remove(index) {
		this.texts.splice(index, 1);
	}

	selectPrev() {
		this.selected = (--this.selected + this.texts.length) % this.texts.length;
	}

	selectNext() {
		this.selected = ++this.selected % this.texts.length;
	}

	selectFirst() {
		this.selected = 0;
	}

	selectLast() {
		this.selected = this.texts.length - 1;
	}

	getSelected() {
		return this.texts[this.selected];
	}

	// returns [{text, textColor?, backColor?}]
	getLinesForDisplay() {
		let lines = Array(this.size + this.previewSize + 1).fill({text: ''});

		if (this.texts.length === 0)
			return lines;

		Texts.setLines(lines, this.texts.map(text => ({text})));
		lines[this.selected].textColor = SELECTED_TEXT_COLOR;
		lines[this.selected].backColor = SELECTED_BG_COLOR;

		let selectedLines = this.getSelected().split('\n');
		if (selectedLines.length > this.previewSize) {
			selectedLines = selectedLines.slice(0, this.previewSize - 1);
			selectedLines.push('...');
		}
		Texts.setLines(lines, selectedLines.map(text =>
			({text, textColor: SELECTED_BG_COLOR, backColor: SELECTED_TEXT_COLOR})), this.size + 1);

		return lines;
	}

	static setLines(lines, values, start = 0) {
		values.forEach((value, i) => lines[i + start] = value);
	}
}

module.exports = Texts;

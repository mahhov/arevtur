const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class InputImportTradeSearchUrl extends XElement {
	static get attributeTypes() {
		return {
			text: {},
			tooltip: {},
		};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#button').addEventListener('click', () => this.emit('click'));
	}

	set text(value) {
		this.$('#button').textContent = value;
	}

	set tooltip(value) {
		this.clearChildren('#tooltip');
		let span;
		value
			.split(/(@[-\w,]+|\n)/)
			.filter(v => v)
			.forEach(term => {
				if (term[0] === '@') {
					span = this.addTooltipSpan(term.slice(1).split(','));
					return;
				}
				if (term === '\n')
					span = this.addTooltipSpan();
				else if (!span)
					span = this.addTooltipSpan();
				span.textContent += term;
			});
	}

	addTooltipSpan(classes = []) {
		let span = document.createElement('span');
		span.classList.add(...classes);
		this.$('#tooltip').appendChild(span);
		return span;
	}
});

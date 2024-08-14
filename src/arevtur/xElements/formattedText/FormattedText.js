const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class InputImportTradeSearchUrl extends XElement {
	static get attributeTypes() {
		return {
			text: {},
		};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
	}

	set text(value) {
		this.clearChildren('#container');
		let span;
		value
			.split(/(@[-\w,]+ |\n)/)
			.filter(v => v)
			.forEach(term => {
				if (term[0] === '@') {
					span = this.addTooltipSpan(term.slice(1, -1).split(','));
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
		this.$('#container').appendChild(span);
		return span;
	}
});

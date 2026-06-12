const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {
			text: {},
			tooltip: {},
			tooltipRight: {},
		};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#button').addEventListener('click', () => this.emit('click'));
		this.$('#button').addEventListener('mouseenter', () => this.positionTooltip());
		this.tooltipValue_ = '';
		this.tooltipRightValue_ = '';
	}

	set text(value) {
		this.$('#button').textContent = value;
	}

	set tooltip(value) {
		this.tooltipValue_ = value;
		this.$('#tooltip').text = value;
		this.updateWrapperVisibility();
	}

	set tooltipRight(value) {
		this.tooltipRightValue_ = value;
		this.$('#tooltip-right').text = value;
		this.updateWrapperVisibility();
	}

	updateWrapperVisibility() {
		if (this.tooltipValue_ || this.tooltipRightValue_)
			this.$('#tooltip-wrapper').setAttribute('data-visible', '');
		else
			this.$('#tooltip-wrapper').removeAttribute('data-visible');
	}

	positionTooltip() {
		let rect = this.$('#button').getBoundingClientRect();
		let wrapper = this.$('#tooltip-wrapper');
		wrapper.style.left = '0px';
		wrapper.style.top = '0px';
		wrapper.style.maxHeight = '';
		requestAnimationFrame(() => {
			let wrapperRect = wrapper.getBoundingClientRect();
			let left = Math.max(0, Math.min(rect.left, window.innerWidth - wrapperRect.width));
			let top = rect.bottom;
			if (top + wrapperRect.height > window.innerHeight)
				top = rect.top - wrapperRect.height;
			if (top < 0) {
				top = 0;
				wrapper.style.maxHeight = rect.top + 'px';
			}
			wrapper.style.left = left + 'px';
			wrapper.style.top = top + 'px';
		});
	}
});

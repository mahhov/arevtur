const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('slot').addEventListener('slotchange', () => this.checkForAppended());
		this.checkForAppended();
	}

	checkForAppended() {
		this.$('slot').assignedElements()
			.filter(el => !el.draggable)
			.forEach(el => this.appended(el));
	}

	appended(element) {
		element.draggable = true;
		element.addEventListener('dragstart', e => {
			this.draggingFrom = this.indexOf(element);
			this.dragging = e.target;
			this.dragging.classList.add('dragging');
		});
		element.addEventListener('dragenter', e => {
			if (this.indexOf(this.dragging) < this.indexOf(e.target))
				e.target.after(this.dragging);
			else
				e.target.before(this.dragging);
		});
		element.addEventListener('dragend', () => {
			this.dragging.classList.remove('dragging');
			this.dragging = null;
			this.emit('arrange', {from: this.draggingFrom, to: this.indexOf(element)});
		});
	}

	indexOf(child) {
		let children = this.$('slot').assignedElements();
		return children.indexOf(child);
	}
});

const {XElement, importUtil} = require('xx-element');
const {configForRenderer} = require('../../../services/config/configForRenderer');
const {template, name} = importUtil(__filename);

let deepQuery = (selector, el = document) => {
	return [...el.querySelectorAll(selector)]
		.concat([...el.querySelectorAll('*')]
			.map(el => el.shadowRoot)
			.filter(el => el)
			.flatMap(el => deepQuery(selector, el)));
};

customElements.define(name, class Tour extends XElement {
	static get attributeTypes() {
		return {};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		configForRenderer.addListener('change', config => {
			if (config.tourComplete)
				this.end();
			else if (this.steps && this.stepI >= this.steps.length)
				this.start();
		});

		setTimeout(() => {
			this.steps = [
				{
					lines: ['1/5', 'Select your league and paste your session ID.'],
					elements: [
						...deepQuery('#league-input'),
						...deepQuery('#session-id-input'),
						// ...deepQuery('#results-chart'),
					],
					corner: {x: -1, y: 1},
					offset: {x: 1, y: 1},
				},
			];
			if (!configForRenderer.config.tourComplete)
				this.start();
		}, 100);

		this.$('#prev').addEventListener('click', () => {
			this.stepI--;
			this.update();
		});
		this.$('#next').addEventListener('click', () => {
			this.stepI++;
			this.update();
		});
		this.$('#dismiss').addEventListener('click', () => {
			this.stepI = this.steps.length;
			this.update();
		});

		this.end();
	}

	start() {
		this.classList.remove('hidden');
		this.stepI = 0;
		this.updateInterval = setInterval(() => this.update(), 50);
	}

	end() {
		this.stepI = Infinity;
		this.classList.add('hidden');
		clearInterval(this.updateInterval);
	}

	update() {
		if (this.stepI >= this.steps.length) {
			configForRenderer.config = {tourComplete: true};
			this.end();
			return;
		}

		this.$('#prev').disabled = !this.stepI;

		let step = this.steps[this.stepI];
		this.$('#text').textContent = step.lines.join('\n') || '';

		let padding = 3;
		let rects = step.elements.map(el => el.getBoundingClientRect());
		let left = Math.min(...rects.map(r => r.x)) - padding;
		let top = Math.min(...rects.map(r => r.y)) - padding;
		let right = Math.max(...rects.map(r => r.x + r.width)) + padding * 2;
		let bottom = Math.max(...rects.map(r => r.y + r.height)) + padding * 2;

		this.$('#highlight-border').style.left = left;
		this.$('#highlight-border').style.top = top;
		this.$('#highlight-border').style.width = right - left;
		this.$('#highlight-border').style.height = bottom - top;

		this.$('#container').style.left = Tour.anchoredPosition(
			left, right, this.$('#container').offsetWidth,
			step.corner.x, step.offset.x);
		this.$('#container').style.top = Tour.anchoredPosition(
			top, bottom, this.$('#container').offsetHeight,
			step.corner.y, step.offset.y);

		this.highlightedElements
			?.filter(el => !step.elements.includes(el))
			.forEach(el => el.classList.remove('tour-highlight'));
		this.highlightedElements = step.elements;
		this.highlightedElements.forEach(el => el.classList.add('tour-highlight'));
	}

	static anchoredPosition(left, right, selfWidth, cornerAnchor, offsetAnchor) {
		return left
			+ (right - left) * (cornerAnchor + 1) / 2
			+ selfWidth * (offsetAnchor / 2 - .5);
	}
});

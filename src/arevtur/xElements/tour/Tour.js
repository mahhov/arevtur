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
					lines: ['1/6', 'Select your league and paste your session ID.'],
					elementQueries: [
						'#league-input',
						'#session-id-input',
					],
					corner: {x: -1, y: 1}, // take the left/bottom corner of elements
					align: {x: 1, y: 1}, // align it with the the tour's left/top corner
				}, {
					lines: ['1/6', 'These indicators should turn orange then green.'],
					elementQueries: [
						'#loaded-leagues-status',
						'#loaded-types-status',
						'#loaded-properties-status',
						'#loaded-currencies-status',
						'#loaded-items-status',
					],
					corner: {x: -1, y: 1},
					align: {x: 1, y: 1},
				}, {
					lines: ['2/6', 'Select your PoB and build paths.'],
					elementQueries: [
						'#pob-path',
						'#build-path',
					],
					corner: {x: -1, y: 1},
					align: {x: 1, y: 1},
				}, {
					lines: ['2/6', 'This indicator should turn orange then green.'],
					elementQueries: [
						'#loaded-pob-status',
					],
					corner: {x: 1, y: 1},
					align: {x: -1, y: 1},
				}, {
					lines: ['3/6', 'Select an item type and max price; e.g. amulet for under 50c.'],
					elementQueries: [
						'#type-input',
						'label:has(#min-value-input)',
						'label:has(#price-input)',
					],
					corner: {x: -1, y: 1},
					align: {x: 1, y: 1},
				}, {
					lines: ['4/6', 'Use PoB magic to jump start a query.'],
					elementQueries: [
						'#build-import-for-type-button',
					],
					corner: {x: -1, y: 1},
					align: {x: 1, y: 1},
				}, {
					lines: ['4/6', 'These configurations will dictate how PoB imports behave.'],
					elementQueries: [
						'.tour-pob-configs',
					],
					corner: {x: -1, y: 1},
					align: {x: 1, y: 1},
				}, {
					lines: ['4/6', 'You can further fine tune the trade query with these inputs.'],
					elementQueries: [
						'#input-trade-params',
					],
					corner: {x: -1, y: -1},
					align: {x: 1, y: -1},
				}, {
					lines: ['4/6', 'These buttons allow bulk editing trade query stats.'],
					elementQueries: [
						'#drop-implicit-mods-button',
						'#replace-resist-mods-button',
						'#replace-attribute-mods-button',
						'#enable-all-mods-button',
					],
					corner: {x: -1, y: 1},
					align: {x: 1, y: 1},
				}, {
					lines: ['4/6', 'Niche (and experimental) query options can be enabled here.'],
					elementQueries: [
						'[config-key=experimental]',
					],
					corner: {x: 1, y: 1},
					align: {x: -1, y: 1},
				}, {
					lines: ['5/6', 'Submit'],
					elementQueries: [
						'#submit-button',
					],
					corner: {x: -1, y: -1},
					align: {x: 1, y: -1},
				}, {
					lines: ['6/6', 'The found items.'],
					elementQueries: [
						'x-item-listing',
					],
					corner: {x: -1, y: 1},
					align: {x: 1, y: 1},
				}, {
					lines: ['6/6', 'Values'],
					elementQueries: [
						'#value-eval',
						'#value-build',
						'#value-craft',
					],
					corner: {x: -1, y: 1},
					align: {x: 1, y: 1},
				}, {
					lines: ['6/6', 'Chart'],
					elementQueries: [
						'#results-chart',
					],
					corner: {x: -1, y: 1},
					align: {x: 1, y: 1},
				}, {
					lines: ['6/6', 'Select a preferred sorting method.'],
					elementQueries: [
						'#sort-build-value-input',
					],
					corner: {x: -1, y: 1},
					align: {x: 1, y: 1},
				}, {
					lines: ['6/6', 'Maximize results.'],
					elementQueries: [
						'[config-key=viewMaximize]',
					],
					corner: {x: 1, y: 1},
					align: {x: -1, y: 1},
				}, {
					lines: ['Revisit tutorial'],
					elementQueries: [
						'[config-key=tourComplete]',
					],
					corner: {x: 1, y: 1},
					align: {x: -1, y: 1},
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
			if (this.stepI === this.steps.length - 1 ||
				this.steps[this.stepI + 1].elementQueries
					.map(query => deepQuery(query)[0])
					.every(v => v)) {
				this.stepI++;
				this.update();
			}
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
		let elements = step.elementQueries.map(query => deepQuery(query)[0]);
		this.$('#text').textContent = step.lines.join('\n') || '';

		let padding = 3;
		let rects = elements.map(el => el.getBoundingClientRect());
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
			step.corner.x, step.align.x);
		this.$('#container').style.top = Tour.anchoredPosition(
			top, bottom, this.$('#container').offsetHeight,
			step.corner.y, step.align.y);

		elements.forEach(el => el.classList.add('tour-highlight'));
		this.highlightedElements
			?.filter(el => !elements.includes(el))
			.forEach(el => el.classList.remove('tour-highlight'));
		this.highlightedElements = elements;
	}

	static anchoredPosition(left, right, selfWidth, cornerAnchor, alignAnchor) {
		return left
			+ (right - left) * (cornerAnchor + 1) / 2
			+ selfWidth * (alignAnchor / 2 - .5);
	}
});

// todo[blocking] finalize texts

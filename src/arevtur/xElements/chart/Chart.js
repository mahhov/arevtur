const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);

customElements.define(name, class Chart extends XElement {
	static get attributeTypes() {
		return {width: {}, height: {}, background: {}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.ctx = this.$('canvas').getContext('2d');
		this.ctx.font = '14px serif';
		this.$('canvas').addEventListener('mousedown', e => {
			this.dragged = false;
			if (!e.ctrlKey)
				this.mouseDown = {x: e.offsetX, y: e.offsetY};
		});
		this.$('canvas').addEventListener('mousemove', e => {
			this.emit('hover', this.pixelToCoord(e.offsetX, e.offsetY));
			if (!this.mouseDown)
				return;
			this.dragged = true;
			if (e.buttons & 1 && !e.shiftKey)
				this.panRange(e.offsetX - this.mouseDown.x, e.offsetY - this.mouseDown.y);
			else if (e.buttons & 2 || e.shiftKey)
				this.zoomRange(e.offsetX - this.mouseDown.x, e.offsetY - this.mouseDown.y);
			this.mouseDown = {x: e.offsetX, y: e.offsetY};
		});
		this.$('canvas').addEventListener('mouseleave', () => this.emit('hover'));
		document.addEventListener('mouseup', () => this.mouseDown = null);
		this.$('canvas').addEventListener('click', e => {
			if (this.dragged)
				return;
			this.emit(e.ctrlKey ? 'action' : 'select', this.pixelToCoord(e.offsetX, e.offsetY));
		});
		this.$('canvas').addEventListener('dblclick', e => {
			if (this.dragged)
				return;
			this.resetRange(e.shiftKey);
		});
		this.background = this.background || 'white';
		this.pointSets = [];
		this.resetRange();
	}

	set width(value) {
		this.$('canvas').width = value;
	}

	set height(value) {
		this.$('canvas').height = value;
	}

	set background(value) {
		this.draw();
	}

	set pointSets(value) {
		this.pointSets_ = value;
		this.draw();
	}

	resetRange(zeroMins = false) {
		let allPoints = this.pointSets_
			.filter(({isPath}) => !isPath)
			.flatMap(({points}) => points);
		[this.minX, this.deltaX] = Chart.getRange(allPoints.map(({x}) => x), zeroMins);
		[this.minY, this.deltaY] = Chart.getRange(allPoints.map(({y}) => y), zeroMins);
		this.verifyRange();
		this.draw();
	}

	panRange(x, y) {
		this.minX -= x * this.deltaX / this.width;
		this.minY += y * this.deltaY / this.height;
		this.verifyRange();
		this.draw();
	}

	zoomRange(x, y) {
		let dx = x * this.deltaX / this.width;
		let dy = -y * this.deltaY / this.height;
		this.minX += dx;
		this.minY += dy;
		this.deltaX -= dx * 2;
		this.deltaY -= dy * 2;
		this.verifyRange();
		this.draw();
	}

	verifyRange() {
		this.minX = Math.max(this.minX, -this.deltaX / 10);
		this.minY = Math.max(this.minY, -this.deltaY / 10);
	}

	draw() {
		if (!this.background || !this.pointSets_ || this.minX === undefined)
			return;
		this.ctx.fillStyle = this.background;
		this.ctx.fillRect(0, 0, this.width, this.height);
		this.drawPoints();
		this.drawAxis();
	}

	drawPoints() {
		this.pointSets_.forEach(({color, fill, size, points, isPath}) => {
			this.ctx.strokeStyle = color;
			this.ctx.fillStyle = color;
			if (isPath) {
				this.ctx.lineWidth = size;
				this.ctx.beginPath();
				points.forEach((p, i) => {
					let {x, y} = this.coordToPixel(p.x, p.y);
					if (!i)
						this.ctx.moveTo(x, y);
					else
						this.ctx.lineTo(x, y);
				});
				if (fill)
					this.ctx.fill();
				else
					this.ctx.stroke();
			} else {
				points.forEach(p => {
					let {x, y} = this.coordToPixel(p.x, p.y);
					this.ctx[fill ? 'fillRect' : 'strokeRect'](x - size / 2, y - size / 2, size, size);
				});
			}
		});
	}

	drawAxis() {
		let n = 20;
		let step = this.width / n;
		let size = 10;
		let sizeSmall = 1;

		this.ctx.lineWidth = 1;
		this.ctx.strokeStyle = `rgb(0,0,0)`;
		this.ctx.fillStyle = `rgb(0,0,0)`;
		this.ctx.strokeRect(this.width / n, this.height * (n - 1) / n, this.width * (n - 2) / n, 0); // x axis line
		this.ctx.strokeRect(this.width / n, this.height / n, 0, this.width * (n - 2) / n); // y axis line
		for (let i = 2; i < n; i += 2) {
			let x = i * step;
			let y = (n - i) * step;
			let xText = (this.minX + i / n * this.deltaX).toFixed(0);
			let yText = (this.minY + i / n * this.deltaY).toFixed(0);
			this.ctx.fillText(xText, x - 9, step * (n - 1) + 17); // x axis text
			this.ctx.fillText(yText, step - 28, y + 4, 30); // y axis text
			this.ctx.fillRect(x - sizeSmall / 2, step * (n - 1) - size / 2, sizeSmall, size); // x axis dots
			this.ctx.fillRect(step - size / 2, x - sizeSmall / 2, size, sizeSmall); // y axis dots
		}
	}

	pixelToCoord(x, y) {
		return {
			x: x / this.width * this.deltaX + this.minX,
			y: (1 - y / this.height) * this.deltaY + this.minY,
			width: 20 / this.width * this.deltaX,
			height: 20 / this.height * this.deltaY
		};
	}

	coordToPixel(x, y) {
		return {
			x: x === Infinity ? this.width : (x - this.minX) / this.deltaX * this.width,
			y: y === Infinity ? 0 : (1 - (y - this.minY) / this.deltaY) * this.height,
		};
	}

	static getRange(values, zeroMin = false, buffer = .1) {
		let min = values.length && !zeroMin ? Math.min(...values) : 0;
		let max = values.length ? Math.max(...values) : 10;
		let delta = max - min;
		return [min - delta * buffer, delta + delta * buffer * 2]
	}
});

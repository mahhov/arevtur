const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const TradeQuery = require('../../TradeQuery');
const configForRenderer = require('../../../services/config/configForRenderer');
const {round, updateElementChildren} = require('../../../util/util');

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {selected: {boolean: true}, hovered: {boolean: true}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#direct-whisper').addEventListener('click', async e => {
			e.stopPropagation();
			if (!await this.directWhisper()) {
				let oldPrice = this.itemData_.price.price;
				await this.refresh();
				if (this.itemData_.price.price === oldPrice)
					await this.directWhisper();
			}
		});
		this.$('#copy-whisper').addEventListener('click', e => {
			e.stopPropagation();
			navigator.clipboard.writeText(this.itemData_.whisperText);
		});
		this.$('#copy-item-button').addEventListener('click', e => {
			e.stopPropagation();
			navigator.clipboard.writeText(this.itemData_.text);
		});
		this.$('#refresh-button').addEventListener('click', e => {
			e.stopPropagation();
			this.refresh();
		});
		this.$('#debug').addEventListener('click', e => {
			e.stopPropagation();
			navigator.clipboard.writeText(JSON.stringify(this.itemData_, null, 2));
		});
		this.addEventListener('click', () => this.emit('select'));
		this.addEventListener('mouseenter', () => {
			if (!this.hovered)
				this.emit('hover', true);
		});
		this.addEventListener('mouseleave', () => this.emit('hover', false));
	}

	set itemData(itemData) {
		// should only be called once to avoid a late-resolved, stale itemData.buildValuePromise
		// overwriting the correct one
		this.itemData_ = itemData;

		this.$('#name-text').textContent = itemData.displayLines[0];
		this.$('#body').text = itemData.displayLines[1];
		this.$('#account-text').text = itemData.displayLines[2];

		this.$('#weight-value').text = `Weighted: ${round(itemData.weightedValue, 1)}`;
		let expandedValues = Object.entries(itemData.weightedValueDetails)
			.filter(([_, value]) => value);
		this.$('#weight-value').tooltip = expandedValues.length > 1 ?
			expandedValues.map(([name, value]) => `${round(value, 1)} ${name}`).join(' + ') : '';
		itemData.buildValuePromise.then(buildValue => {
			this.$('#build-value').text = `Build: ${buildValue.value}`;
			this.$('#build-value').tooltip = buildValue.text;
		}).catch(e => 0);
		itemData.craftValuePromise.then(craftValue => {
			this.$('#craft-value').text = `Craft: ${craftValue.value}`;
			this.$('#craft-value').tooltip = craftValue.text;
		}).catch(e => 0);

		this.$('#price').text = itemData.price.priceSummary;
		this.$('#price').tooltip = itemData.price.priceBreakdown;

		this.$('#direct-whisper').classList.toggle('hidden', !itemData.directWhisperToken);
		this.$('#copy-whisper').classList.toggle('hidden', !itemData.whisperText);

		this.$('#debug').text = itemData.queryNotes[0];
		this.$('#debug').tooltip = itemData.queryNotes.join('\n');

		this.selected = itemData.selected;
		this.hovered = itemData.hovered;
		this.setButtonColor(this.$('#direct-whisper'), '');
		this.setButtonColor(this.$('#refresh-button'), '');
	}

	get itemData() {
		return this.itemData_;
	}

	set selected(value) {
		this.classList.toggle('selected', value);
	}

	set hovered(value) {
		this.classList.toggle('hovered', value);
	}

	async directWhisper() {
		navigator.clipboard.writeText(this.itemData_.whisperText);
		let whisperSuccess = await TradeQuery.directWhisper(configForRenderer.config.version2, configForRenderer.config.sessionId, this.itemData_.directWhisperToken);
		this.setButtonColor(this.$('#direct-whisper'), whisperSuccess ? 'busy' : 'invalid');
		this.setButtonColor(this.$('#refresh-button'), whisperSuccess ? '' : 'valid');
		return whisperSuccess;
	}

	async refresh() {
		let tradeApiItemsData = await TradeQuery.itemsApiQuery(configForRenderer.config.version2, configForRenderer.config.sessionId, {}, this.itemData_.queryId, [this.itemData_.id]);
		this.itemData_.refresh(tradeApiItemsData.result[0]);
		this.itemData = this.itemData_;
		this.setButtonColor(this.$('#direct-whisper'), '');
		this.setButtonColor(this.$('#refresh-button'), 'busy');
	}

	setButtonColor(button, color) {
		button.classList.remove('busy', 'valid', 'invalid');
		if (color)
			button.classList.add(color);
	}
});

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
		this.$('#direct-whisper').addEventListener('click', e =>
			this.onDirectWhisperClick(e, this.$('#direct-whisper'), this.itemData_.directWhisperToken));
		this.$('#copy-whisper').addEventListener('click', e => {
			e.stopPropagation();
			navigator.clipboard.writeText(this.itemData_.whisperText);
		});
		this.$('#travel-hideout').addEventListener('click', e =>
			this.onDirectWhisperClick(e, this.$('#travel-hideout'), this.itemData_.travelHideoutToken));
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

	async setItemData(itemData) {
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
		this.$('#build-value').text = `Build: ${(await itemData.buildValuePromise).value}`;
		this.$('#build-value').tooltip = (await itemData.buildValuePromise).text;
		this.$('#craft-value').text = `Craft: ${(await itemData.craftValuePromise).value}`;
		this.$('#craft-value').tooltip = (await itemData.craftValuePromise).text;
		this.$('#price').text = (await itemData.pricePromise).priceSummary;
		this.$('#price').tooltip = (await itemData.pricePromise).priceBreakdown;

		this.$('#direct-whisper').classList.toggle('hidden', !itemData.directWhisperToken);
		this.$('#copy-whisper').classList.toggle('hidden', !itemData.whisperText);
		this.$('#travel-hideout').classList.toggle('hidden', !itemData.travelHideoutToken);

		this.$('#debug').text = itemData.queryNotes[0];
		this.$('#debug').tooltip = itemData.queryNotes.join('\n');

		this.selected = itemData.selected;
		this.hovered = itemData.hovered;
		this.setButtonColor(this.$('#direct-whisper'), '');
		this.setButtonColor(this.$('#travel-hideout'), '');
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

	async onDirectWhisperClick(event, buttonEl, token) {
		event.stopPropagation();
		if (await this.directWhisper(buttonEl, token))
			return;
		let oldPrice = this.itemData_.pricePromise.resolved.price;
		await this.refresh();
		if (this.itemData_.pricePromise.resolved.price === oldPrice)
			await this.directWhisper(buttonEl, token);
	}

	async directWhisper(buttonEl, token) {
		if (this.itemData_.whisperText)
			navigator.clipboard.writeText(this.itemData_.whisperText);
		let success = await TradeQuery.directWhisper(configForRenderer.config.version2, configForRenderer.config.sessionId, token);
		this.setButtonColor(buttonEl, success ? 'busy' : 'invalid');
		this.setButtonColor(this.$('#refresh-button'), success ? '' : 'valid');
		return success;
	}

	async refresh() {
		TradeQuery.itemGetter.clearCache(this.itemData_.id);
		let itemGetterDataPromise = TradeQuery.itemGetter.get(configForRenderer.config.version2, configForRenderer.config.sessionId, {}, this.itemData_.queryId, this.itemData_.id);
		TradeQuery.itemGetter.flush();
		let itemGetterData = await itemGetterDataPromise;
		this.itemData_.refresh(itemGetterData);
		await this.setItemData(this.itemData_);
		this.setButtonColor(this.$('#direct-whisper'), '');
		this.setButtonColor(this.$('#travel-hideout'), '');
		this.setButtonColor(this.$('#refresh-button'), 'busy');
	}

	setButtonColor(button, color) {
		button.classList.remove('busy', 'valid', 'invalid');
		if (color)
			button.classList.add(color);
	}
});

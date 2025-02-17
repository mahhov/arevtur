const {XElement, importUtil} = require('xx-element');
const {template, name} = importUtil(__filename);
const TradeQuery = require('../../TradeQuery');
const configForRenderer = require('../../../services/config/configForRenderer');
const {round} = require('../../../util/util');

const listTuples = [
	['#influence-list', 'influences'],
	['#sockets-list', 'sockets'],
	['#defense-list', 'defenseProperties'],
	['#enchant-list', 'enchantMods'],
	['#rune-list', 'runeMods'],
	['#implicit-list', 'implicitMods'],
	['#fractured-list', 'fracturedMods'],
	['#explicit-list', 'explicitMods'],
	['#crafted-list', 'craftedMods'],
	['#pseudo-list', 'pseudoMods'],
];

customElements.define(name, class extends XElement {
	static get attributeTypes() {
		return {selected: {boolean: true}, hovered: {boolean: true}};
	}

	static get htmlTemplate() {
		return template;
	}

	connectedCallback() {
		this.$('#direct-whisper').addEventListener('click', e => {
			navigator.clipboard.writeText(this.itemData_.whisperText);
			TradeQuery.directWhisper(configForRenderer.config.version2, configForRenderer.config.sessionId, this.itemData_.directWhisperToken);
			e.stopPropagation();
		});
		this.$('#copy-whisper').addEventListener('click', e => {
			navigator.clipboard.writeText(this.itemData_.whisperText);
			e.stopPropagation();
		});
		this.$('#copy-item-button').addEventListener('click', e => {
			navigator.clipboard.writeText(this.itemData_.text);
			e.stopPropagation();
		});
		this.$('#refresh-button').addEventListener('click', async () => {
			let tradeApiItemsData = await TradeQuery.itemsApiQuery(configForRenderer.config.version2, configForRenderer.config.sessionId, {}, this.itemData_.queryId, [this.itemData_.id]);
			this.itemData_.refresh(tradeApiItemsData.result[0]);
			this.itemData = this.itemData_;
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

		this.$('#name-text').textContent = itemData.name;
		this.$('#type-text').textContent = itemData.subtype;
		this.$('#item-level-text').textContent = itemData.itemLevel;

		this.$('#corrupted-text').classList.toggle('hidden', !itemData.corrupted);
		this.$('#mirrored-text').classList.toggle('hidden', !itemData.mirrored);
		this.$('#split-text').classList.toggle('hidden', !itemData.split);

		listTuples.forEach(([containerQuery, propertyName]) => {
			XElement.clearChildren(this.$(containerQuery));
			itemData[propertyName].forEach(mod => {
				let modDiv = document.createElement('div');
				modDiv.textContent = mod;
				this.$(containerQuery).appendChild(modDiv);
			});
		});

		this.$('#prefixes-text').textContent = itemData.affixes.prefix;
		this.$('#suffixes-text').textContent = itemData.affixes.suffix;
		this.$('#affix-value-text').textContent = itemData.weightedValueDetails.affixes;
		this.$('#quality-text').textContent = itemData.quality;
		this.$('#defense-value-text').textContent = round(itemData.weightedValueDetails.defenses, 3);
		this.$('#weight-value-text').textContent = round(itemData.weightedValueDetails.mods, 3);

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

		let currency = configForRenderer.config.version2 ? 'exalt' : 'chaos';
		this.$('#price').text = `${round(itemData.price, 1)} ${currency}`;
		let expandedPriceShifts = Object.entries(itemData.priceDetails.shifts)
			.map(([name, value]) => ` + ${name} (${round(value, 1)} ${currency})`);
		this.$('#price').tooltip = `${itemData.priceDetails.count} ${itemData.priceDetails.currency}${expandedPriceShifts.join('')}`;
		this.$('#account-text').textContent = itemData.accountText;
		this.$('#account-text').title = itemData.accountText;
		const msInHour = 1000 * 60 * 60;
		let dateDiff = (new Date() - new Date(itemData.date)) / msInHour;
		this.$('#date-text').textContent = dateDiff > 24 ?
			`${round(dateDiff / 24, 1)} days ago` :
			`${round(dateDiff, 1)} hours ago`;
		this.$('#online-status-text').textContent = itemData.onlineStatus;
		this.$('#online-status-text').classList.toggle('offline', itemData.onlineStatus === 'offline');

		this.selected = itemData.selected;
		this.hovered = itemData.hovered;
	}

	set selected(value) {
		this.classList.toggle('selected', value);
	}

	set hovered(value) {
		this.classList.toggle('hovered', value);
	}

	get searchTexts() {
		return [...this.$$('div')]
			.filter(div => !div.querySelector('div') && !div.classList.contains('hidden'))
			.map(div => div.textContent.trim().replace(/\s+/g, ' '))
			.filter(text => text);
	}
});

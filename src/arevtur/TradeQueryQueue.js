const Emitter = require('../util/Emitter');

class TradeQueryQueue extends Emitter {
	tradeQuerySets = [];
	activeTradeQuerySet = [];

	addQueries(tradeQueries) {
		this.tradeQuerySets.push(tradeQueries);
		tradeQueries.forEach(tradeQuery => {
			tradeQuery.itemStream.forEach(items => {
				if (this.activeTradeQuerySet.includes(tradeQuery))
					this.emit('items', items);
			});
			tradeQuery.progressStream.forEach(() => this.updateProgress());
			tradeQuery.errorStream.forEach(error => this.emit('error', error));
			tradeQuery.start();
		});
	}

	setActiveTradeQueries(tradeQueries) {
		this.activeTradeQuerySet = tradeQueries;
	}

	get activeTradeQueriesItems() {
		return this.activeTradeQuerySet.map(tradeQuery => tradeQuery.itemStream.written).flat(2);
	}

	updateProgress() {
		let progresses = this.activeTradeQuerySet
			.map(tradeQuery => tradeQuery.progressStream)
			.map(progressStream => progressStream.lastValue)
			.filter(progress => progress);
		let queriesComplete = progresses.reduce((sum, progress) => sum + progress.queriesComplete, 0);
		let queriesTotal = progresses.reduce((sum, progress) => sum + progress.queriesTotal, 0) || 1;
		let itemCount = progresses.reduce((sum, progress) => sum + progress.itemCount, 0);
		this.emit('progress', {ratio: queriesComplete / queriesTotal, itemCount});
	}

	cancel() {
		this.tradeQuerySets.flat().forEach(tradeQuery => tradeQuery.stop());
		this.tradeQuerySets = [];
	}
}

module.exports = TradeQueryQueue;

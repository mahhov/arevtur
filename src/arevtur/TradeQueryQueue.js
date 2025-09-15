const Emitter = require('../util/Emitter');

class TradeQueryQueue extends Emitter {
	activeTradeQuerySet = [];

	addQueries(tradeQueries) {
		tradeQueries.forEach(tradeQuery => {
			tradeQuery.itemStream.forEach(items => {
				if (this.activeTradeQuerySet.includes(tradeQuery))
					this.emit('items', items);
			});
			tradeQuery.progressStream.forEach(progress => {
				console.debug('TradeQueryQueue progress', progress);
				this.updateProgress();
			});
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
			.map(progressStream => progressStream.written)
			.flat();
		let queriesComplete = progresses.reduce((sum, progress) => sum + progress.queriesComplete, 0);
		let queriesTotal = progresses.reduce((sum, progress) => sum + progress.queriesTotal, 0) || 1;
		let itemCount = progresses.reduce((sum, progress) => sum + progress.itemCount, 0);
		this.emit('progress', {ratio: queriesComplete / queriesTotal, itemCount});
	}
}

module.exports = TradeQueryQueue;

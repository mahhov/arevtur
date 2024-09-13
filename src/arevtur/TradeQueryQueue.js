const Emitter = require('../util/Emitter');

class TradeQueryQueue extends Emitter {
	tradeQueries = [];

	addQueries(tradeQueries) {
		tradeQueries.forEach(tradeQuery => {
			this.tradeQueries.push(tradeQuery);
			tradeQuery.itemStream.forEach(items => this.emit('items', items));
			tradeQuery.progressStream.forEach(() => this.updateProgress());
			tradeQuery.start();
		});
	}

	updateProgress() {
		let progresses = this.tradeQueries.map(tradeQuery => tradeQuery.progressStream)
			.map(progressStream => progressStream.lastValue)
			.filter(progress => progress);
		let queriesComplete = progresses.reduce((sum, progress) =>
			sum + progress.queriesComplete, 0);
		let queriesTotal = progresses.reduce((sum, progress) =>
			sum + progress.queriesTotal, 0);
		let itemCount = progresses.reduce((sum, progress) =>
			sum + progress.itemCount, 0);
		this.emit('progress', {ratio: queriesComplete / queriesTotal, itemCount});
	}

	cancel() {
		this.tradeQueries.forEach(tradeQuery => tradeQuery.stop());
		this.tradeQueries = [];
	}
}

module.exports = TradeQueryQueue;

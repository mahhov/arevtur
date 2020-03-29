const DataFetcher = require('../services/DataFetcher');

let alignColumns = rows => {
	let columns = rows[0].map((_, i) => rows.map(row => row[i]));
	let colWidths = columns.map(column => Math.max(...column.map(text => text.length)));
	return rows.map(row => row.map((text, colI) => text.toString().padEnd(colWidths[colI])));
};

let str = num => (parseInt(num * 100) / 100).toString();

let main = async () => {
	let data = (await DataFetcher.getData(DataFetcher.endpoints.GEM)).lines
		.reduce((data, {name, corrupted, gemLevel, gemQuality, chaosValue}) => {
			let key = [corrupted && 'corrupted', gemLevel === 20 && 'level', gemQuality && 'quality'].filter(a => a).join('_');
			data[name] = data[name] || {};
			data[name][key] = chaosValue;
			return data;
		}, {});
	let outLines = Object.entries(data)
		.map(([key, value]) => ({name: key, ...value}))
		.filter(gem => gem.quality && gem.level)
		.map(gem => ({...gem, valueRatio: gem.quality / (gem.level + 1), valueAbsolute: gem.quality - gem.level - 1}))
		.sort((gem1, gem2) => gem2.valueAbsolute - gem1.valueAbsolute)
		.filter((_, i) => i < 15)
		.map(gem => [gem.name, str(gem.valueAbsolute), str(gem.level), str(gem.quality)]);
	return alignColumns([['GEM', 'PROFIT', 'LEVEL 20', 'QUALITY 20'], ...outLines]).map(line => line.join('   '));
};

module.exports = main;

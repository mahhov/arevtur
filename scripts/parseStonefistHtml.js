#!/usr/bin/env node
// Parses mappings.html (poe2db Way of the Stonefist table) into stonefistMapping.js
// Usage: node scripts/parseStonefistHtml.js

const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../.kiro/features/way-of-the-stonefist/mappings.html');
const outputPath = path.resolve(__dirname, '../src/services/pobApi/stonefistMapping.js');

let html = fs.readFileSync(htmlPath, 'utf8');

// Extract table rows
let rows = [...html.matchAll(/<tr role="row">([\s\S]*?)<\/tr>/g)].map(m => m[1]);

// Parse a cell's text content, stripping HTML tags
function cellText(td) {
	return td
		.replace(/<br\s*\/?>/g, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

// Parse mod-values from a cell: returns array of {value, isRange, min, max}
function parseValues(td) {
	let values = [];
	// Match mod-value spans, which may contain ranges with ndash
	let spans = [...td.matchAll(/<span class="mod-value">([\s\S]*?)<\/span>/g)];
	for (let span of spans) {
		let content = span[1].replace(/<[^>]+>/g, '').trim();
		let rangeMatch = content.match(/^\(?(-?[\d.]+)\s*[—–-]\s*(-?[\d.]+)\)?$/);
		if (rangeMatch)
			values.push({isRange: true, min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2])});
		else
			values.push({isRange: false, min: parseFloat(content), max: parseFloat(content)});
	}
	return values;
}

// Parse each row into {prefix, origText, convText, origValues, convValues}
let entries = [];
for (let row of rows) {
	let tds = [...row.matchAll(/<td>([\s\S]*?)<\/td>/g)].map(m => m[1]);
	if (tds.length < 3) continue;
	let prefix = cellText(tds[0]);
	if (prefix !== 'Prefix' && prefix !== 'Suffix') continue;

	let origText = cellText(tds[1]);
	let convText = cellText(tds[2]);
	let origValues = parseValues(tds[1]);
	let convValues = parseValues(tds[2]);

	entries.push({prefix, origText, convText, origValues, convValues});
}

// Group entries by normalized pattern (replace numbers with #)
function normalizePattern(text) {
	return text.replace(/[\d.]+/g, '#').replace(/\(#[—–-]#\)/g, '#').replace(/#+/g, '#');
}

let groups = new Map();
for (let entry of entries) {
	let key = normalizePattern(entry.origText);
	if (!groups.has(key)) groups.set(key, []);
	groups.get(key).push(entry);
}

// Build mappings
let mappings = [];
for (let [key, group] of groups) {
	// Determine pattern from first entry's text
	let sample = group[0].origText;
	let isMultiLine = sample.includes('\n');
	let lines = sample.split('\n');

	// Build regex: replace numeric values with (\d+) or ([\d.]+)
	let patternStr = lines.map(line =>
		line.replace(/[\d.]+/g, '(\\d+)')
			.replace(/[.*+?^${}()|[\]\\]/g, (m) => m === '(' || m === ')' || m === '\\' || m === 'd' || m === '+' ? m : '\\' + m)
	).join('\\n');

	// Simplify: only keep first capture group per line for most patterns
	// Actually just use the sample to build a proper regex
	let regexStr = lines.map(line => {
		return line
			.replace(/([.*+?^${}|[\]\\])/g, '\\$1')
			.replace(/[\d.]+/g, () => '(\\d+)');
	}).join('\\n');

	// Determine tierCapture: for "Adds X to Y" patterns, use 2nd capture
	let tierCapture = undefined;
	if (regexStr.match(/^Adds \(\\d\+\) to \(\\d\+\)/))
		tierCapture = 2;

	// Build tiers
	let tiers = group.map(entry => {
		let origVal = entry.origValues[tierCapture ? tierCapture - 1 : 0];
		let tier = {orig: [origVal.min, origVal.max]};

		// Build conv string with $N placeholders for ranged values
		let convParts = entry.convText;
		let convRanges = [];
		let convIdx = 0;
		for (let cv of entry.convValues) {
			let searchStr = cv.isRange ? `(${cv.min}—${cv.max})` : String(cv.min);
			// Also try without parens
			let searchStr2 = cv.isRange ? `${cv.min}—${cv.max}` : String(cv.min);
			if (cv.isRange) {
				convIdx++;
				convRanges.push([cv.min, cv.max]);
				convParts = convParts.replace(searchStr, `$${convIdx}`).replace(searchStr2, `$${convIdx}`);
			}
		}

		tier.conv = convParts;
		if (convRanges.length > 0) tier.convRanges = convRanges;
		return tier;
	});

	let mapping = {pattern: regexStr, tiers};
	if (tierCapture) mapping.tierCapture = tierCapture;
	mappings.push(mapping);
}

// Generate output
let output = `// Auto-generated stonefist mapping for Way of the Stonefist glove conversions
// Generated from: .kiro/features/way-of-the-stonefist/mappings.html
// Re-generate with: node scripts/parseStonefistHtml.js

let mappings = [
${mappings.map(m => {
	let tierCaptureLine = m.tierCapture ? `\t\ttierCapture: ${m.tierCapture},\n` : '';
	let tiersStr = m.tiers.map(t => {
		let parts = [`orig: [${t.orig.join(', ')}]`, `conv: ${JSON.stringify(t.conv)}`];
		if (t.convRanges) parts.push(`convRanges: [${t.convRanges.map(r => `[${r.join(', ')}]`).join(', ')}]`);
		return `\t\t\t{${parts.join(', ')}}`;
	}).join(',\n');
	return `\t{\n\t\tpattern: /${m.pattern}/,\n${tierCaptureLine}\t\ttiers: [\n${tiersStr},\n\t\t],\n\t}`;
}).join(',\n')},
];

function stripMarkup(line) {
\treturn line.replace(/\\[([^|\\]]+)\\|([^\\]]+)\\]/g, '$2').replace(/\\[([^\\]]+)\\]/g, '$1');
}

function transformGloveText(text) {
\tlet lines = text.split('\\n');
\tlet result = [];
\tfor (let i = 0; i < lines.length; i++) {
\t\tlet line = stripMarkup(lines[i]);
\t\tlet matched = false;
\t\tfor (let mapping of mappings) {
\t\t\tlet isMultiLine = mapping.pattern.source.includes('\\\\n');
\t\t\tlet testStr = line;
\t\t\tif (isMultiLine && i + 1 < lines.length) {
\t\t\t\tlet numNewlines = (mapping.pattern.source.match(/\\\\n/g) || []).length;
\t\t\t\tlet combined = [line];
\t\t\t\tfor (let j = 1; j <= numNewlines && i + j < lines.length; j++) {
\t\t\t\t\tcombined.push(stripMarkup(lines[i + j]));
\t\t\t\t}
\t\t\t\ttestStr = combined.join('\\n');
\t\t\t}
\t\t\tlet m = mapping.pattern.exec(testStr);
\t\t\tif (!m) continue;
\t\t\tlet captureIdx = mapping.tierCapture || 1;
\t\t\tlet value = parseFloat(m[captureIdx]);
\t\t\tlet tier = mapping.tiers.find(t => value >= t.orig[0] && value <= t.orig[1]);
\t\t\tif (!tier) continue;
\t\t\tlet conv = tier.conv;
\t\t\tif (tier.convRanges) {
\t\t\t\tlet roundTo = (r) => {
\t\t\t\t\tlet decimals = Math.max(
\t\t\t\t\t\t(String(r[0]).split('.')[1] || '').length,
\t\t\t\t\t\t(String(r[1]).split('.')[1] || '').length
\t\t\t\t\t);
\t\t\t\t\treturn v => +(v.toFixed(decimals));
\t\t\t\t};
\t\t\t\tif (tier.orig[0] !== tier.orig[1]) {
\t\t\t\t\tlet t = (value - tier.orig[0]) / (tier.orig[1] - tier.orig[0]);
\t\t\t\t\tconv = conv.replace(/\\$(\\d+)/g, (_, n) => {
\t\t\t\t\t\tlet r = tier.convRanges[parseInt(n) - 1];
\t\t\t\t\t\treturn roundTo(r)(r[0] + t * (r[1] - r[0]));
\t\t\t\t\t});
\t\t\t\t} else {
\t\t\t\t\tconv = conv.replace(/\\$(\\d+)/g, (_, n) => {
\t\t\t\t\t\tlet r = tier.convRanges[parseInt(n) - 1];
\t\t\t\t\t\treturn roundTo(r)((r[0] + r[1]) / 2);
\t\t\t\t\t});
\t\t\t\t}
\t\t\t}
\t\t\tif (isMultiLine) {
\t\t\t\tlet numNewlines = (mapping.pattern.source.match(/\\\\n/g) || []).length;
\t\t\t\ti += numNewlines;
\t\t\t}
\t\t\tresult.push(...conv.split('\\n'));
\t\t\tmatched = true;
\t\t\tbreak;
\t\t}
\t\tif (!matched) result.push(lines[i]);
\t}
\treturn result.join('\\n');
}

module.exports = {transformGloveText, mappings};
`;

fs.writeFileSync(outputPath, output);
console.log(`Generated ${outputPath}`);
console.log(`${mappings.length} mappings with ${mappings.reduce((s, m) => s + m.tiers.length, 0)} total tiers`);

const defensePropertyTuples = [
	['armour', '#armour-input'],
	['evasion', '#evasion-input'],
	['energyShield', '#energy-shield-input'],
];

const affixPropertyTuples = [
	['prefix', '#prefix-input'],
	['suffix', '#suffix-input'],
];

const influenceProperties = [
	'hunter',
	'crusader',
	'shaper',
	'elder',
	'redeemer',
	'warlord',
];

const queryPropertyFilters = [
	// queryParamsKey, queryPropertyFilter, hasWeight
	['weightEntries', 'weight', true],
	['andEntries', 'and', true],
	['notEntries', 'not'],
	['conditionalPrefixEntries', 'conditional prefix', true],
	['conditionalSuffixEntries', 'conditional suffix', true],
];

module.exports = {
	defensePropertyTuples,
	affixPropertyTuples,
	influenceProperties,
	queryPropertyFilters,
};

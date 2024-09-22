const defensePropertyTuples = [
	['armour', '#armour-input'],
	['evasion', '#evasion-input'],
	['energyShield', '#energy-shield-input'],
];

const defenseBuildValueTuples = [
	// this key, el query, mapping to defense property, mod property
	['armourBuildValue', '#armour-build-value', 'armour', '# Armour'],
	['evasionBuildValue', '#evasion-build-value', 'evasion', '# Evasion'],
	['energyShieldBuildValue', '#energy-shield-build-value', 'energyShield', '# Energy shield'],
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
	// key, filter, hasWeight, isShared
	['weightEntries', 'weight', true, false],
	// todo[blocking 1] show min/max input for and filters
	['andEntries', 'and', true, false],
	// todo[blocking 2] disable weight input for filters without weight
	['notEntries', 'not', false, false],
	// todo[blocking 3] add 'or' filter
	// todo[medium] get pob weight recommendations for conditional affixes
	['conditionalPrefixEntries', 'conditional prefix', true, false],
	['conditionalSuffixEntries', 'conditional suffix', true, false],
	['sharedWeightEntries', 'weight', true, true],
];

module.exports = {
	defensePropertyTuples,
	defenseBuildValueTuples,
	affixPropertyTuples,
	influenceProperties,
	queryPropertyFilters,
};

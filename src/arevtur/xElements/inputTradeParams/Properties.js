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
	// queryParamsKey, queryPropertyFilter, hasWeight
	['weightEntries', 'weight', true],
	['andEntries', 'and', true],
	// todo[low] disable weight input for filters without weight
	['notEntries', 'not'],
	// todo[medium] get pob weight recommendations for conditional affixes
	['conditionalPrefixEntries', 'conditional prefix', true],
	['conditionalSuffixEntries', 'conditional suffix', true],
];

module.exports = {
	defensePropertyTuples,
	defenseBuildValueTuples,
	affixPropertyTuples,
	influenceProperties,
	queryPropertyFilters,
};

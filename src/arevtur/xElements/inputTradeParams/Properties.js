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
	['notEntries', 'not'],
	['conditionalPrefixEntries', 'conditional prefix', true], // todo [high] allow sending conditional affix to pob
	['conditionalSuffixEntries', 'conditional suffix', true],
];

module.exports = {
	defensePropertyTuples,
	defenseBuildValueTuples,
	affixPropertyTuples,
	influenceProperties,
	queryPropertyFilters,
};

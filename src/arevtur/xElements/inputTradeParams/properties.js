const defensePropertyTuples = [
	['armour', '#armour-input'],
	['evasion', '#evasion-input'],
	['energyShield', '#energy-shield-input'],
	['block', '#block-input'],
];

const defenseBuildValueTuples = [
	// this key, el query, mapping to defense property, mod property, plugin number
	['armourBuildValue', '#armour-build-value', 'armour', '# Armour', 400],
	['evasionBuildValue', '#evasion-build-value', 'evasion', '# Evasion', 400],
	['energyShieldBuildValue', '#energy-shield-build-value', 'energyShield', '# Energy shield', 400],
	['blockBuildValue', '#block-build-value', 'block', '# chance to Block', 1],
];

const minDefensePropertyTuples = [
	['minArmour', '#min-armour-input'],
	['minEvasion', '#min-evasion-input'],
	['minEnergyShield', '#min-energy-shield-input'],
];

const minRequirementPropertyTuples = [
	['minLevelRequirement', '#min-level-requirement-input'],
];

const maxRequirementPropertyTuples = [
	['maxLevelRequirement', '#max-level-requirement-input'],
	['maxStrengthRequirement', '#max-strength-requirement-input'],
	['maxDexterityRequirement', '#max-dexterity-requirement-input'],
	['maxIntelligenceRequirement', '#max-intelligence-requirement-input'],
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
	['andEntries', 'and', true, false],
	['notEntries', 'not', false, false],
	// todo[medium] get pob weight recommendations for conditional affixes
	['conditionalPrefixEntries', 'conditional prefix', true, false],
	['conditionalSuffixEntries', 'conditional suffix', true, false],
	['sharedWeightEntries', 'weight', true, true],
];

module.exports = {
	defensePropertyTuples,
	defenseBuildValueTuples,
	minDefensePropertyTuples,
	minRequirementPropertyTuples,
	maxRequirementPropertyTuples,
	affixPropertyTuples,
	influenceProperties,
	queryPropertyFilters,
};

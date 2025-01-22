module.exports = [
	{
		id: 'effectiveHealth',
		display: 'Eff Hit Pool',
		tooltip: 'Weight for 1% More Effective Hit Pool',
		regex: [/effective hit pool \(([+-][\d.]+)%\)/i],
	},
	{
		id: 'totalLife',
		display: 'Total Life',
		tooltip: 'Weight for 1% More Total Life',
		regex: [],
	},
	{
		id: 'totalMana',
		display: 'Total Mana',
		tooltip: 'Weight for +% More Total Mana',
		regex: [],
	},
	{
		id: 'manaRegen',
		display: 'Mana Regen',
		tooltip: 'Weight for +% More Mana Regen',
		regex: [],
	},
	{
		id: 'elementalResist',
		display: 'Ele Resists',
		tooltip: 'Weight for +1 elemental resists, including over-cap resists',
		regex: [],
	},
	{
		id: 'chaosResist',
		display: 'Chaos Resist',
		tooltip: 'Weight for +1 chaos resist, including over-cap resist',
		regex: [/([+-]\d+)% chaos res(?:\.|istance)/i],
	},
	{
		id: 'damage',
		display: 'Full DPS',
		tooltip: 'Weight for 1% More Full DPS',
		regex: [/full dps \(([+-][\d.]+)%\)/i],
	},
	{
		id: 'str',
		display: 'Str',
		tooltip: 'Weight for +1 total strength on top of other bonuses the stat provides',
		regex: [/([+-]\d+) strength/i],
	},
	{
		id: 'dex',
		display: 'Dex',
		tooltip: 'Weight for +1 total dexterity on top of other bonuses the stat provides',
		regex: [/([+-]\d+) dexterity/i],
	},
	{
		id: 'int',
		display: 'Int',
		tooltip: 'Weight for +1 total intelligence on top of other bonuses the stat provides',
		regex: [/([+-]\d+) intelligence/i],
	},
];

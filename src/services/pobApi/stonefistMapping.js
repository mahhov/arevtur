// Auto-generated stonefist mapping for Way of the Stonefist glove conversions
// Maps original glove mods to their Fists (converted) equivalents

let mappings = [
	{
		pattern: /Adds (\d+) to (\d+) Cold damage to Attacks/,
		tierCapture: 2,
		tiers: [
			{orig: [2, 3], conv: "Attacks Gain 10% of Damage as Extra Cold Damage"},
			{orig: [5, 8], conv: "Attacks Gain 11% of Damage as Extra Cold Damage"},
			{orig: [9, 11], conv: "Attacks Gain 12% of Damage as Extra Cold Damage"},
			{orig: [12, 14], conv: "Attacks Gain 13% of Damage as Extra Cold Damage"},
			{orig: [15, 17], conv: "Attacks Gain 14% of Damage as Extra Cold Damage"},
			{orig: [18, 21], conv: "Attacks Gain $1% of Damage as Extra Cold Damage", convRanges: [[15, 16]]},
			{orig: [22, 24], conv: "Attacks Gain $1% of Damage as Extra Cold Damage", convRanges: [[17, 18]]},
			{orig: [25, 31], conv: "Attacks Gain $1% of Damage as Extra Cold Damage", convRanges: [[19, 20]]},
			{orig: [32, 37], conv: "Attacks Gain $1% of Damage as Extra Cold Damage", convRanges: [[21, 23]]},
		],
	},
	{
		pattern: /Adds (\d+) to (\d+) Fire damage to Attacks/,
		tierCapture: 2,
		tiers: [
			{orig: [3, 3], conv: "Attacks Gain 10% of Damage as Extra Fire Damage"},
			{orig: [6, 9], conv: "Attacks Gain 11% of Damage as Extra Fire Damage"},
			{orig: [10, 13], conv: "Attacks Gain 12% of Damage as Extra Fire Damage"},
			{orig: [14, 17], conv: "Attacks Gain 13% of Damage as Extra Fire Damage"},
			{orig: [18, 20], conv: "Attacks Gain 14% of Damage as Extra Fire Damage"},
			{orig: [21, 26], conv: "Attacks Gain $1% of Damage as Extra Fire Damage", convRanges: [[15, 16]]},
			{orig: [27, 32], conv: "Attacks Gain $1% of Damage as Extra Fire Damage", convRanges: [[17, 18]]},
			{orig: [33, 36], conv: "Attacks Gain $1% of Damage as Extra Fire Damage", convRanges: [[19, 20]]},
			{orig: [37, 45], conv: "Attacks Gain $1% of Damage as Extra Fire Damage", convRanges: [[21, 23]]},
		],
	},
	{
		pattern: /Adds (\d+) to (\d+) Lightning damage to Attacks/,
		tierCapture: 2,
		tiers: [
			{orig: [4, 6], conv: "Attacks Gain 10% of Damage as Extra Lightning Damage"},
			{orig: [10, 15], conv: "Attacks Gain 11% of Damage as Extra Lightning Damage"},
			{orig: [16, 22], conv: "Attacks Gain 12% of Damage as Extra Lightning Damage"},
			{orig: [23, 27], conv: "Attacks Gain 13% of Damage as Extra Lightning Damage"},
			{orig: [28, 32], conv: "Attacks Gain 14% of Damage as Extra Lightning Damage"},
			{orig: [33, 40], conv: "Attacks Gain $1% of Damage as Extra Lightning Damage", convRanges: [[15, 16]]},
			{orig: [41, 47], conv: "Attacks Gain $1% of Damage as Extra Lightning Damage", convRanges: [[17, 18]]},
			{orig: [48, 59], conv: "Attacks Gain $1% of Damage as Extra Lightning Damage", convRanges: [[19, 20]]},
			{orig: [60, 71], conv: "Attacks Gain $1% of Damage as Extra Lightning Damage", convRanges: [[21, 23]]},
		],
	},
	{
		pattern: /Adds (\d+) to (\d+) Physical Damage to Attacks/,
		tierCapture: 2,
		tiers: [
			{orig: [3, 3], conv: "Attacks Gain 10% of Damage as Extra Physical Damage"},
			{orig: [4, 6], conv: "Attacks Gain 11% of Damage as Extra Physical Damage"},
			{orig: [5, 8], conv: "Attacks Gain 12% of Damage as Extra Physical Damage"},
			{orig: [8, 11], conv: "Attacks Gain 13% of Damage as Extra Physical Damage"},
			{orig: [9, 13], conv: "Attacks Gain 14% of Damage as Extra Physical Damage"},
			{orig: [12, 17], conv: "Attacks Gain $1% of Damage as Extra Physical Damage", convRanges: [[15, 16]]},
			{orig: [14, 20], conv: "Attacks Gain $1% of Damage as Extra Physical Damage", convRanges: [[17, 18]]},
			{orig: [18, 26], conv: "Attacks Gain $1% of Damage as Extra Physical Damage", convRanges: [[19, 20]]},
			{orig: [22, 32], conv: "Attacks Gain $1% of Damage as Extra Physical Damage", convRanges: [[21, 23]]},
		],
	},
	{
		pattern: /(\d+)% increased Magnitude of Ailments you inflict/,
		tiers: [
			{orig: [10, 20], conv: "$1% increased Magnitude of Damaging Ailments you inflict with Critical Hits", convRanges: [[20, 35]]},
			{orig: [20, 25], conv: "+$1 to Ailment Threshold\n$2% increased Elemental Ailment Threshold", convRanges: [[10, 25], [10, 20]]},
			{orig: [26, 32], conv: "+$1 to Ailment Threshold\n$2% increased Elemental Ailment Threshold", convRanges: [[26, 40], [21, 35]]},
		],
	},
	{
		pattern: /(\d+)% increased Magnitude of Bleeding you inflict/,
		tiers: [
			{orig: [20, 29], conv: "Enemies you kill have a $1% chance to explode, dealing a tenth of their maximum Life as Physical damage", convRanges: [[10, 30]]},
			{orig: [30, 42], conv: "Enemies you kill have a $1% chance to explode, dealing a tenth of their maximum Life as Physical damage", convRanges: [[31, 50]]},
		],
	},
	{
		pattern: /Damaging Ailments deal damage (\d+)% faster/,
		tiers: [
			{orig: [8, 13], conv: "Enemies take $1% increased Damage for each Elemental Ailment type among\nyour Ailments on them", convRanges: [[5, 10]]},
			{orig: [14, 20], conv: "Enemies take $1% increased Damage for each Elemental Ailment type among\nyour Ailments on them", convRanges: [[11, 15]]},
		],
	},
	{
		pattern: /(\d+)% increased Ignite Magnitude/,
		tiers: [
			{orig: [20, 34], conv: "Enemies killed by your Hits are destroyed\nBurning Enemies you kill have a $1% chance to Explode, dealing a\ntenth of their maximum Life as Fire Damage", convRanges: [[10, 30]]},
			{orig: [20, 40], conv: "$1% chance to Avoid being Ignited", convRanges: [[20, 50]]},
			{orig: [35, 50], conv: "Enemies killed by your Hits are destroyed\nBurning Enemies you kill have a $1% chance to Explode, dealing a\ntenth of their maximum Life as Fire Damage", convRanges: [[31, 50]]},
		],
	},
	{
		pattern: /(\d+)% increased Magnitude of Poison you inflict/,
		tiers: [
			{orig: [10, 16], conv: "Critical Hits Poison the enemy"},
			{orig: [20, 29], conv: "Enemies you kill have a $1% chance to explode, dealing a quarter of their maximum Life as Chaos damage", convRanges: [[9, 14]]},
			{orig: [30, 42], conv: "Enemies you kill have a $1% chance to explode, dealing a quarter of their maximum Life as Chaos damage", convRanges: [[15, 20]]},
		],
	},
	{
		pattern: /\+(\d+) to Accuracy Rating/,
		tiers: [
			{orig: [11, 32], conv: "$1% chance to Blind Enemies on Hit with Attacks", convRanges: [[12, 14]]},
			{orig: [33, 60], conv: "$1% chance to Blind Enemies on Hit with Attacks", convRanges: [[15, 17]]},
			{orig: [61, 84], conv: "$1% chance to Blind Enemies on Hit with Attacks", convRanges: [[18, 20]]},
			{orig: [85, 123], conv: "$1% chance to Blind Enemies on Hit with Attacks", convRanges: [[21, 23]]},
			{orig: [124, 167], conv: "$1% chance to Blind Enemies on Hit with Attacks", convRanges: [[24, 26]]},
			{orig: [168, 236], conv: "$1% chance to Blind Enemies on Hit with Attacks", convRanges: [[27, 29]]},
			{orig: [237, 346], conv: "$1% chance to Blind Enemies on Hit with Attacks", convRanges: [[30, 32]]},
			{orig: [347, 450], conv: "$1% chance to Blind Enemies on Hit with Attacks", convRanges: [[33, 35]]},
			{orig: [451, 550], conv: "$1% chance to Blind Enemies on Hit with Attacks", convRanges: [[36, 38]]},
		],
	},
	{
		pattern: /\+(\d+) to maximum Life/,
		tiers: [
			{orig: [10, 19], conv: "5% less damage taken while on Low Life"},
			{orig: [20, 29], conv: "6% less damage taken while on Low Life"},
			{orig: [30, 39], conv: "7% less damage taken while on Low Life"},
			{orig: [40, 59], conv: "8% less damage taken while on Low Life"},
			{orig: [60, 69], conv: "9% less damage taken while on Low Life"},
			{orig: [70, 84], conv: "10% less damage taken while on Low Life"},
			{orig: [85, 99], conv: "11% less damage taken while on Low Life"},
			{orig: [100, 119], conv: "12% less damage taken while on Low Life"},
			{orig: [120, 149], conv: "13% less damage taken while on Low Life"},
			{orig: [150, 174], conv: "14% less damage taken while on Low Life"},
			{orig: [175, 189], conv: "15% less damage taken while on Low Life"},
			{orig: [190, 199], conv: "16% less damage taken while on Low Life"},
			{orig: [200, 214], conv: "17% less damage taken while on Low Life"},
		],
	},
	{
		pattern: /\+(\d+) to maximum Mana/,
		tiers: [
			{orig: [10, 14], conv: "$1% more Attack damage while on Low Mana", convRanges: [[10, 11]]},
			{orig: [15, 24], conv: "$1% more Attack damage while on Low Mana", convRanges: [[12, 13]]},
			{orig: [25, 34], conv: "$1% more Attack damage while on Low Mana", convRanges: [[14, 15]]},
			{orig: [35, 54], conv: "$1% more Attack damage while on Low Mana", convRanges: [[16, 17]]},
			{orig: [55, 64], conv: "$1% more Attack damage while on Low Mana", convRanges: [[18, 19]]},
			{orig: [65, 79], conv: "$1% more Attack damage while on Low Mana", convRanges: [[20, 21]]},
			{orig: [80, 89], conv: "$1% more Attack damage while on Low Mana", convRanges: [[22, 23]]},
			{orig: [90, 104], conv: "$1% more Attack damage while on Low Mana", convRanges: [[24, 25]]},
			{orig: [105, 124], conv: "$1% more Attack damage while on Low Mana", convRanges: [[26, 27]]},
		],
	},
	{
		pattern: /\+(\d+) to Armour\n\+(\d+) to maximum Energy Shield/,
		tiers: [
			{orig: [9, 16], conv: "Has +1 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [17, 46], conv: "Has +2 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [47, 71], conv: "Has +3 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [72, 85], conv: "Has +4 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
		],
	},
	{
		pattern: /\+(\d+) to Armour\n\+(\d+) to Evasion Rating/,
		tiers: [
			{orig: [9, 16], conv: "Has +1 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [17, 46], conv: "Has +2 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [47, 71], conv: "Has +3 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [72, 85], conv: "Has +4 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
		],
	},
	{
		pattern: /\+(\d+) to Evasion Rating\n\+(\d+) to maximum Energy Shield/,
		tiers: [
			{orig: [6, 10], conv: "Has +1 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [11, 41], conv: "Has +2 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [42, 64], conv: "Has +3 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [65, 78], conv: "Has +4 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
		],
	},
	{
		pattern: /(\d+)% increased Armour and Energy Shield/,
		tiers: [
			{orig: [15, 26], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[7, 8]]},
			{orig: [27, 42], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[9, 10]]},
			{orig: [43, 55], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[11, 12]]},
			{orig: [56, 67], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[13, 14]]},
			{orig: [68, 79], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[15, 16]]},
			{orig: [80, 91], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[17, 18]]},
			{orig: [92, 100], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[19, 20]]},
		],
	},
	{
		pattern: /(\d+)% increased Armour and Energy Shield\n\+(\d+) to maximum Life/,
		tiers: [
			{orig: [6, 13], conv: "3% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [14, 20], conv: "4% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [21, 26], conv: "5% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [27, 32], conv: "6% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [33, 38], conv: "7% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [39, 42], conv: "8% of Damage Taken Recouped as Life, Mana and Energy Shield"},
		],
	},
	{
		pattern: /(\d+)% increased Armour and Evasion/,
		tiers: [
			{orig: [15, 26], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[7, 8]]},
			{orig: [27, 42], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[9, 10]]},
			{orig: [43, 55], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[11, 12]]},
			{orig: [56, 67], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[13, 14]]},
			{orig: [68, 79], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[15, 16]]},
			{orig: [80, 91], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[17, 18]]},
			{orig: [92, 100], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[19, 20]]},
		],
	},
	{
		pattern: /(\d+)% increased Armour, Evasion and Energy Shield/,
		tiers: [
			{orig: [15, 26], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[7, 8]]},
			{orig: [27, 42], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[9, 10]]},
			{orig: [43, 55], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[11, 12]]},
			{orig: [56, 67], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[13, 14]]},
			{orig: [68, 79], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[15, 16]]},
			{orig: [80, 91], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[17, 18]]},
			{orig: [92, 100], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[19, 20]]},
			{orig: [101, 110], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[21, 22]]},
		],
	},
	{
		pattern: /(\d+)% increased Armour and Evasion\n\+(\d+) to maximum Life/,
		tiers: [
			{orig: [6, 13], conv: "3% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [14, 20], conv: "4% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [21, 26], conv: "5% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [27, 32], conv: "6% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [33, 38], conv: "7% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [39, 42], conv: "8% of Damage Taken Recouped as Life, Mana and Energy Shield"},
		],
	},
	{
		pattern: /(\d+)% increased Armour\n\+(\d+) to maximum Life/,
		tiers: [
			{orig: [6, 13], conv: "3% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [14, 20], conv: "4% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [21, 26], conv: "5% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [27, 32], conv: "6% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [33, 38], conv: "7% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [39, 42], conv: "8% of Damage Taken Recouped as Life, Mana and Energy Shield"},
		],
	},
	{
		pattern: /\+(\d+) to maximum Energy Shield/,
		tiers: [
			{orig: [10, 17], conv: "Has +1 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [18, 24], conv: "Has +1 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [25, 30], conv: "Has +2 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [31, 35], conv: "Has +2 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [36, 41], conv: "Has +3 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [42, 47], conv: "Has +3 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [48, 60], conv: "Has +4 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [100, 150], conv: "$1% increased maximum Energy Shield", convRanges: [[7, 16]]},
		],
	},
	{
		pattern: /(\d+)% increased Energy Shield\n\+(\d+) to maximum Life/,
		tiers: [
			{orig: [6, 13], conv: "3% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [14, 20], conv: "4% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [21, 26], conv: "5% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [27, 32], conv: "6% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [33, 38], conv: "7% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [39, 42], conv: "8% of Damage Taken Recouped as Life, Mana and Energy Shield"},
		],
	},
	{
		pattern: /(\d+)% increased Energy Shield/,
		tiers: [
			{orig: [15, 26], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[7, 8]]},
			{orig: [27, 42], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[9, 10]]},
			{orig: [43, 55], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[11, 12]]},
			{orig: [56, 67], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[13, 14]]},
			{orig: [68, 79], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[15, 16]]},
			{orig: [80, 91], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[17, 18]]},
			{orig: [92, 100], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[19, 20]]},
		],
	},
	{
		pattern: /(\d+)% increased Evasion and Energy Shield/,
		tiers: [
			{orig: [15, 26], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[7, 8]]},
			{orig: [27, 42], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[9, 10]]},
			{orig: [43, 55], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[11, 12]]},
			{orig: [56, 67], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[13, 14]]},
			{orig: [68, 79], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[15, 16]]},
			{orig: [80, 91], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[17, 18]]},
			{orig: [92, 100], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[19, 20]]},
		],
	},
	{
		pattern: /(\d+)% increased Evasion and Energy Shield\n\+(\d+) to maximum Life/,
		tiers: [
			{orig: [6, 13], conv: "3% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [14, 20], conv: "4% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [21, 26], conv: "5% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [27, 32], conv: "6% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [33, 38], conv: "7% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [39, 42], conv: "8% of Damage Taken Recouped as Life, Mana and Energy Shield"},
		],
	},
	{
		pattern: /(\d+)% increased Evasion Rating\n\+(\d+) to maximum Life/,
		tiers: [
			{orig: [6, 13], conv: "3% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [14, 20], conv: "4% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [21, 26], conv: "5% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [27, 32], conv: "6% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [33, 38], conv: "7% of Damage Taken Recouped as Life, Mana and Energy Shield"},
			{orig: [39, 42], conv: "8% of Damage Taken Recouped as Life, Mana and Energy Shield"},
		],
	},
	{
		pattern: /\+(\d+) to Evasion Rating/,
		tiers: [
			{orig: [11, 18], conv: "Has +1 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [19, 46], conv: "Has +1 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [47, 66], conv: "Has +2 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [67, 87], conv: "Has +2 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [88, 116], conv: "Has +3 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [117, 146], conv: "Has +3 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [147, 176], conv: "Has +4 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
		],
	},
	{
		pattern: /(\d+)% increased Evasion Rating/,
		tiers: [
			{orig: [15, 26], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[7, 8]]},
			{orig: [27, 42], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[9, 10]]},
			{orig: [43, 55], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[11, 12]]},
			{orig: [56, 67], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[13, 14]]},
			{orig: [68, 79], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[15, 16]]},
			{orig: [80, 91], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[17, 18]]},
			{orig: [92, 100], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[19, 20]]},
		],
	},
	{
		pattern: /\+(\d+) to Armour/,
		tiers: [
			{orig: [16, 27], conv: "Has +1 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [28, 56], conv: "Has +1 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [57, 77], conv: "Has +2 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [78, 98], conv: "Has +2 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [99, 127], conv: "Has +3 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [128, 159], conv: "Has +3 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
			{orig: [160, 190], conv: "Has +4 to Evasion Rating per player level\nHas +1 to maximum Energy Shield per player level"},
		],
	},
	{
		pattern: /(\d+)% increased Armour/,
		tiers: [
			{orig: [15, 26], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[7, 8]]},
			{orig: [27, 42], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[9, 10]]},
			{orig: [43, 55], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[11, 12]]},
			{orig: [56, 67], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[13, 14]]},
			{orig: [68, 79], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[15, 16]]},
			{orig: [80, 91], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[17, 18]]},
			{orig: [92, 100], conv: "$1% more Global Evasion Rating and Energy Shield", convRanges: [[19, 20]]},
		],
	},
	{
		pattern: /(\d+)% chance to Pierce an Enemy/,
		tiers: [
			{orig: [25, 50], conv: "Projectiles Pierce an additional Target"},
			{orig: [51, 100], conv: "Projectiles Pierce 2 additional Targets"},
		],
	},
	{
		pattern: /(\d+)% increased Effect of your Mark Skills/,
		tiers: [
			{orig: [15, 24], conv: "$1% increased Critical Hit Chance against Marked Enemies", convRanges: [[32, 46]]},
			{orig: [25, 39], conv: "$1% increased Critical Hit Chance against Marked Enemies", convRanges: [[47, 61]]},
		],
	},
	{
		pattern: /(\d+)% increased Projectile Damage/,
		tiers: [
			{orig: [11, 20], conv: "Melee Attacks fire an additional Projectile"},
			{orig: [21, 30], conv: "Melee Attacks fire 2 additional Projectiles"},
			{orig: [31, 40], conv: "Melee Attacks fire 3 additional Projectiles"},
		],
	},
	{
		pattern: /(\d+)% increased Projectile Speed/,
		tiers: [
			{orig: [11, 20], conv: "$1% increased Projectile Damage per Power Charge", convRanges: [[1, 2]]},
			{orig: [21, 30], conv: "$1% increased Projectile Damage per Power Charge", convRanges: [[3, 4]]},
			{orig: [31, 40], conv: "$1% increased Projectile Damage per Power Charge", convRanges: [[5, 6]]},
		],
	},
	{
		pattern: /(\d+)% increased effect of Arcane Surge on you/,
		tiers: [
			{orig: [20, 40], conv: "Gain $1 Life per Enemy Hit with Attacks if you have dealt a Critical Hit Recently", convRanges: [[16, 24]]},
		],
	},
	{
		pattern: /Meta Skills gain (\d+)% increased Energy while on Full Mana/,
		tiers: [
			{orig: [25, 25], conv: "$1% of Damage taken Recouped as Mana", convRanges: [[25, 45]]},
		],
	},
	{
		pattern: /(\d+)% increased Mana Cost Efficiency/,
		tiers: [
			{orig: [6, 10], conv: "$1% increased Reservation Efficiency of Skills", convRanges: [[6, 10]]},
			{orig: [25, 25], conv: "$1% reduced Mana Cost of Attacks", convRanges: [[15, 40]]},
		],
	},
	{
		pattern: /Leech (\d+)% of Physical Attack Damage as Mana/,
		tiers: [
			{orig: [4, 6], conv: "Recover $1% of your maximum Mana when an Enemy dies in your Presence", convRanges: [[2, 6]]},
			{orig: [4, 4.9], conv: "Leech $1% of Physical Attack Damage as Mana\nLeech Mana $2% slower", convRanges: [[6, 7.9], [20, 25]]},
			{orig: [5, 5.9], conv: "Leech $1% of Physical Attack Damage as Mana\nLeech Mana $2% slower", convRanges: [[8, 8.9], [20, 25]]},
			{orig: [6, 6.9], conv: "Leech $1% of Physical Attack Damage as Mana\nLeech Mana $2% slower", convRanges: [[9, 10.9], [20, 25]]},
			{orig: [7, 7.9], conv: "Leech $1% of Physical Attack Damage as Mana\nLeech Mana $2% slower", convRanges: [[11, 11.9], [20, 25]]},
			{orig: [8, 8.9], conv: "Leech $1% of Physical Attack Damage as Mana\nLeech Mana $2% slower", convRanges: [[12, 13], [20, 25]]},
		],
	},
	{
		pattern: /(\d+)% of Maximum Life Converted to Energy Shield/,
		tiers: [
			{orig: [10, 15], conv: "$1% increased Attack Damage while on Low Life", convRanges: [[20, 30]]},
		],
	},
	{
		pattern: /(\d+)% increased maximum Mana/,
		tiers: [
			{orig: [10, 20], conv: "+$1 to maximum Mana\n$2% increased Attack Damage", convRanges: [[36, 42], [15, 35]]},
		],
	},
	{
		pattern: /(\d+)% increased Cost Efficiency/,
		tiers: [
			{orig: [20, 30], conv: "Non-Channelling Skills Cost $1 Mana", convRanges: [[-8, -3]]},
		],
	},
	{
		pattern: /(\d+)% of Spell Mana Cost Converted to Life Cost/,
		tiers: [
			{orig: [25, 50], conv: "Attacks have added Physical damage equal to $1% of maximum Life", convRanges: [[1, 3]]},
		],
	},
	{
		pattern: /\+(\d+)% to Fire and Chaos Resistances/,
		tiers: [
			{orig: [13, 17], conv: "+$1% to Maximum Fire Resistance\n+$2% to Chaos Resistance", convRanges: [[2, 3], [13, 17]]},
		],
	},
	{
		pattern: /\+(\d+) to Strength and Intelligence/,
		tiers: [
			{orig: [9, 15], conv: "$1% increased Strength and Intelligence", convRanges: [[7, 9]]},
		],
	},
	{
		pattern: /\+(\d+)% to Cold and Chaos Resistances/,
		tiers: [
			{orig: [13, 17], conv: "+$1% to Maximum Cold Resistance\n+$2% to Chaos Resistance", convRanges: [[2, 3], [13, 17]]},
		],
	},
	{
		pattern: /\+(\d+) to Dexterity and Intelligence/,
		tiers: [
			{orig: [9, 15], conv: "$1% increased Dexterity and Intelligence", convRanges: [[7, 9]]},
		],
	},
	{
		pattern: /\+(\d+)% to Lightning and Chaos Resistances/,
		tiers: [
			{orig: [13, 17], conv: "+$1% to Maximum Lightning Resistance\n+$2% to Chaos Resistance", convRanges: [[2, 3], [13, 17]]},
		],
	},
	{
		pattern: /\+(\d+) to Strength and Dexterity/,
		tiers: [
			{orig: [9, 15], conv: "$1% increased Strength and Dexterity", convRanges: [[7, 9]]},
		],
	},
	{
		pattern: /(\d+)% increased Area of Effect of Curses/,
		tiers: [
			{orig: [12, 20], conv: "Mark Skills have $1% increased Use Speed", convRanges: [[15, 25]]},
		],
	},
	{
		pattern: /(\d+)% chance to Daze on Hit/,
		tiers: [
			{orig: [10, 20], conv: "Gain $1% of Physical Damage as Extra Cold Damage against Dazed Enemies", convRanges: [[11, 15]]},
		],
	},
	{
		pattern: /(\d+)% increased Immobilisation buildup/,
		tiers: [
			{orig: [10, 20], conv: "$1% increased Damage against Immobilised Enemies", convRanges: [[26, 35]]},
		],
	},
	{
		pattern: /(\d+)% of Leech is Instant/,
		tiers: [
			{orig: [8, 15], conv: "Life Leech can Overflow Maximum Life"},
		],
	},
	{
		pattern: /(\d+)% chance to Gain Arcane Surge when you deal a Critical Hit/,
		tiers: [
			{orig: [10, 15], conv: "$1% chance to gain a Power Charge on Critical Hit", convRanges: [[5, 10]]},
		],
	},
	{
		pattern: /(\d+)% increased Cast Speed when on Full Life/,
		tiers: [
			{orig: [8, 15], conv: "$1% increased Attack Speed when on Full Life", convRanges: [[17, 23]]},
		],
	},
	{
		pattern: /(\d+)% increased chance to inflict Bleeding/,
		tiers: [
			{orig: [20, 30], conv: "Chance to inflict Bleeding is calculated from your base chance to Poison instead"},
			{orig: [30, 50], conv: "Attacks have $1% chance to cause Bleeding", convRanges: [[35, 80]]},
		],
	},
	{
		pattern: /(\d+)% increased Skill Speed if you've consumed a Frenzy Charge Recently/,
		tiers: [
			{orig: [8, 12], conv: "$1% increased Attack Speed if you haven't been Hit Recently", convRanges: [[13, 17]]},
		],
	},
	{
		pattern: /(\d+)% chance for Attack Hits to apply Incision/,
		tiers: [
			{orig: [15, 25], conv: "Attack Hits Aggravate any Bleeding on targets which is older than $1 seconds", convRanges: [[3, 4]]},
		],
	},
	{
		pattern: /(\d+)% increased chance to Poison/,
		tiers: [
			{orig: [20, 30], conv: "Chance to Poison is calculated from your base chance to inflict Bleeding instead"},
		],
	},
	{
		pattern: /(\d+)% increased Area of Effect for Attacks/,
		tiers: [
			{orig: [10, 15], conv: "1% increased Area of Effect for Attacks per 10 Intelligence"},
		],
	},
	{
		pattern: /(\d+)% increased Cast Speed/,
		tiers: [
			{orig: [9, 12], conv: "$1% chance to gain a Power Charge when you Stun", convRanges: [[10, 30]]},
		],
	},
	{
		pattern: /(\d+)% increased Duration of Damaging Ailments on Enemies/,
		tiers: [
			{orig: [10, 19], conv: "$1% increased Duration of Ailments on Enemies", convRanges: [[10, 22]]},
			{orig: [20, 25], conv: "$1% increased Magnitude of Damaging Ailments you inflict with Critical Hits", convRanges: [[15, 25]]},
			{orig: [20, 30], conv: "$1% increased Duration of Ailments on Enemies", convRanges: [[23, 37]]},
		],
	},
	{
		pattern: /Damage Penetrates (\d+)% Elemental Resistances/,
		tiers: [
			{orig: [9, 15], conv: "+$1% to all Elemental Resistances", convRanges: [[20, 30]]},
		],
	},
	{
		pattern: /Remnants can be collected from (\d+)% further away/,
		tiers: [
			{orig: [35, 50], conv: "$1% chance for Remnants you pick up to count as picking up an additional Remnant", convRanges: [[17, 23]]},
		],
	},
	{
		pattern: /\+(\d+)% of Armour also applies to Elemental Damage/,
		tiers: [
			{orig: [14, 19], conv: "+$1% to all Elemental Resistances", convRanges: [[10, 12]]},
			{orig: [20, 25], conv: "+$1% to all Elemental Resistances", convRanges: [[13, 15]]},
			{orig: [26, 31], conv: "+$1% to all Elemental Resistances", convRanges: [[16, 18]]},
			{orig: [32, 37], conv: "+$1% to all Elemental Resistances", convRanges: [[19, 21]]},
			{orig: [38, 43], conv: "+$1% to all Elemental Resistances", convRanges: [[22, 24]]},
		],
	},
	{
		pattern: /\+(\d+)% to Chaos Resistance/,
		tiers: [
			{orig: [4, 7], conv: "+1% to Maximum Chaos Resistance\n+$1% to Chaos Resistance", convRanges: [[6, 9]]},
			{orig: [8, 11], conv: "+1% to Maximum Chaos Resistance\n+$1% to Chaos Resistance", convRanges: [[10, 13]]},
			{orig: [12, 15], conv: "+1% to Maximum Chaos Resistance\n+$1% to Chaos Resistance", convRanges: [[14, 17]]},
			{orig: [16, 19], conv: "+1% to Maximum Chaos Resistance\n+$1% to Chaos Resistance", convRanges: [[18, 21]]},
			{orig: [20, 23], conv: "+1% to Maximum Chaos Resistance\n+$1% to Chaos Resistance", convRanges: [[22, 25]]},
			{orig: [24, 27], conv: "+2% to Maximum Chaos Resistance\n+$1% to Chaos Resistance", convRanges: [[22, 25]]},
		],
	},
	{
		pattern: /\+(\d+)% to Cold Resistance/,
		tiers: [
			{orig: [6, 10], conv: "+1% to Maximum Cold Resistance\n+$1% to Cold Resistance", convRanges: [[11, 15]]},
			{orig: [11, 15], conv: "+1% to Maximum Cold Resistance\n+$1% to Cold Resistance", convRanges: [[16, 20]]},
			{orig: [16, 20], conv: "+1% to Maximum Cold Resistance\n+$1% to Cold Resistance", convRanges: [[21, 25]]},
			{orig: [21, 25], conv: "+2% to Maximum Cold Resistance\n+$1% to Cold Resistance", convRanges: [[21, 25]]},
			{orig: [26, 30], conv: "+2% to Maximum Cold Resistance\n+$1% to Cold Resistance", convRanges: [[26, 30]]},
			{orig: [31, 35], conv: "+2% to Maximum Cold Resistance\n+$1% to Cold Resistance", convRanges: [[31, 35]]},
			{orig: [36, 40], conv: "+2% to Maximum Cold Resistance\n+$1% to Cold Resistance", convRanges: [[36, 40]]},
			{orig: [41, 45], conv: "+3% to Maximum Cold Resistance\n+$1% to Cold Resistance", convRanges: [[36, 40]]},
		],
	},
	{
		pattern: /(\d+)% increased Critical Damage Bonus/,
		tiers: [
			{orig: [10, 14], conv: "+$1% to Critical Hit Chance", convRanges: [[0.5, 1]]},
			{orig: [15, 19], conv: "+$1% to Critical Hit Chance", convRanges: [[1.1, 1.5]]},
			{orig: [20, 24], conv: "+$1% to Critical Hit Chance", convRanges: [[1.6, 2]]},
			{orig: [25, 29], conv: "+$1% to Critical Hit Chance", convRanges: [[2.1, 2.5]]},
			{orig: [30, 34], conv: "+$1% to Critical Hit Chance", convRanges: [[2.5, 3]]},
		],
	},
	{
		pattern: /(\d+)% increased Curse Magnitudes/,
		tiers: [
			{orig: [10, 20], conv: "$1% reduced effect of Curses on you", convRanges: [[20, 30]]},
			{orig: [15, 21], conv: "You can apply an additional Curse"},
			{orig: [22, 29], conv: "You can apply an additional Curse\n$1% increased Curse Magnitudes", convRanges: [[5, 15]]},
		],
	},
	{
		pattern: /(\d+)% increased Exposure Effect/,
		tiers: [
			{orig: [20, 34], conv: "Damage Penetrates $1% Elemental Resistances", convRanges: [[4, 8]]},
			{orig: [35, 50], conv: "Damage Penetrates $1% Elemental Resistances", convRanges: [[9, 15]]},
		],
	},
	{
		pattern: /(\d+)% faster Curse Activation/,
		tiers: [
			{orig: [20, 30], conv: "Gain $1 Mana per Cursed Enemy Hit with Attacks", convRanges: [[1, 10]]},
		],
	},
	{
		pattern: /Leech (\d+)% of Physical Attack Damage as Life\nLeech Life (\d+)% faster/,
		tiers: [
			{orig: [8, 12], conv: "$1% increased Damage while Leeching", convRanges: [[15, 35]]},
		],
	},
	{
		pattern: /(\d+)% increased Curse Duration/,
		tiers: [
			{orig: [50, 99], conv: "Gain $1 Life per Cursed Enemy Hit with Attacks", convRanges: [[1, 10]]},
		],
	},
	{
		pattern: /(\d+)% increased amount of Life Leeched/,
		tiers: [
			{orig: [20, 25], conv: "Life Leech effects are not removed when Unreserved Life is Filled"},
			{orig: [30, 40], conv: "Leech $1% of Physical Attack Damage as Life", convRanges: [[7, 12]]},
		],
	},
	{
		pattern: /Leech (\d+)% of Physical Attack Damage as Life\nLeech Life (\d+)% slower/,
		tiers: [
			{orig: [8, 12], conv: "$1% increased Evasion while Leeching", convRanges: [[15, 35]]},
		],
	},
	{
		pattern: /(\d+)% increased Withered Magnitude/,
		tiers: [
			{orig: [15, 24], conv: "Damage with Weapons Penetrates $1% Chaos Resistance", convRanges: [[5, 9]]},
			{orig: [25, 35], conv: "Damage with Weapons Penetrates $1% Chaos Resistance", convRanges: [[10, 17]]},
		],
	},
	{
		pattern: /\+(\d+) to Dexterity/,
		tiers: [
			{orig: [5, 8], conv: "+$1% Surpassing chance to fire an additional Projectile", convRanges: [[15, 18]]},
			{orig: [9, 12], conv: "+$1% Surpassing chance to fire an additional Projectile", convRanges: [[19, 22]]},
			{orig: [13, 16], conv: "+$1% Surpassing chance to fire an additional Projectile", convRanges: [[23, 26]]},
			{orig: [17, 20], conv: "+$1% Surpassing chance to fire an additional Projectile", convRanges: [[27, 30]]},
			{orig: [21, 24], conv: "+$1% Surpassing chance to fire an additional Projectile", convRanges: [[31, 35]]},
			{orig: [25, 27], conv: "+$1% Surpassing chance to fire an additional Projectile", convRanges: [[36, 40]]},
			{orig: [28, 30], conv: "+$1% Surpassing chance to fire an additional Projectile", convRanges: [[41, 45]]},
			{orig: [31, 33], conv: "+$1% Surpassing chance to fire an additional Projectile", convRanges: [[46, 50]]},
			{orig: [34, 36], conv: "+$1% Surpassing chance to fire an additional Projectile", convRanges: [[51, 60]]},
		],
	},
	{
		pattern: /(\d+)% increased Energy Shield Recharge Rate/,
		tiers: [
			{orig: [5, 8], conv: "$1% faster start of Energy Shield Recharge", convRanges: [[26, 30]]},
			{orig: [9, 11], conv: "$1% faster start of Energy Shield Recharge", convRanges: [[31, 35]]},
			{orig: [12, 15], conv: "$1% faster start of Energy Shield Recharge", convRanges: [[36, 40]]},
			{orig: [16, 19], conv: "$1% faster start of Energy Shield Recharge", convRanges: [[41, 45]]},
			{orig: [20, 23], conv: "$1% faster start of Energy Shield Recharge", convRanges: [[46, 50]]},
			{orig: [24, 27], conv: "$1% faster start of Energy Shield Recharge", convRanges: [[51, 55]]},
		],
	},
	{
		pattern: /(\d+)% increased Quantity of Gold Dropped by Slain Enemies/,
		tiers: [
			{orig: [10, 15], conv: "Charms gain $1 charges per Second", convRanges: [[0.13, 0.27]]},
		],
	},
	{
		pattern: /(\d+)% of Lightning Damage taken Recouped as Life/,
		tiers: [
			{orig: [26, 30], conv: "$1% of Damage taken from Deflected Hits Recouped as Life", convRanges: [[12, 23]]},
		],
	},
	{
		pattern: /(\d+)% increased effect of Socketed Augment Items/,
		tiers: [
			{orig: [60, 60], conv: "Life Flasks gain $1 charges per Second\nMana Flasks gain $2 charges per Second", convRanges: [[0.13, 0.27], [0.13, 0.27]]},
		],
	},
	{
		pattern: /Gain Deflection Rating equal to (\d+)% of Evasion Rating/,
		tiers: [
			{orig: [8, 11], conv: "Prevent +3% of Damage from Deflected Hits"},
			{orig: [12, 14], conv: "Prevent +4% of Damage from Deflected Hits"},
			{orig: [15, 17], conv: "Prevent +5% of Damage from Deflected Hits"},
			{orig: [18, 20], conv: "Prevent +6% of Damage from Deflected Hits"},
			{orig: [21, 23], conv: "Prevent +7% of Damage from Deflected Hits"},
		],
	},
	{
		pattern: /\+(\d+)% to Fire Resistance/,
		tiers: [
			{orig: [6, 10], conv: "+1% to Maximum Fire Resistance\n+$1% to Fire Resistance", convRanges: [[11, 15]]},
			{orig: [11, 15], conv: "+1% to Maximum Fire Resistance\n+$1% to Fire Resistance", convRanges: [[16, 20]]},
			{orig: [16, 20], conv: "+1% to Maximum Fire Resistance\n+$1% to Fire Resistance", convRanges: [[21, 25]]},
			{orig: [21, 25], conv: "+2% to Maximum Fire Resistance\n+$1% to Fire Resistance", convRanges: [[21, 25]]},
			{orig: [26, 30], conv: "+2% to Maximum Fire Resistance\n+$1% to Fire Resistance", convRanges: [[26, 30]]},
			{orig: [31, 35], conv: "+2% to Maximum Fire Resistance\n+$1% to Fire Resistance", convRanges: [[31, 35]]},
			{orig: [36, 40], conv: "+2% to Maximum Fire Resistance\n+$1% to Fire Resistance", convRanges: [[36, 40]]},
			{orig: [41, 45], conv: "+3% to Maximum Fire Resistance\n+$1% to Fire Resistance", convRanges: [[36, 40]]},
		],
	},
	{
		pattern: /\+(\d+) to Level of all Melee Skills/,
		tiers: [
			{orig: [1, 1], conv: "+$1% to Quality of all Skills", convRanges: [[10, 12]]},
			{orig: [2, 2], conv: "+1 to Level of all Melee Skills\n+$1% to Quality of all Skills", convRanges: [[10, 12]]},
		],
	},
	{
		pattern: /(\d+)% increased Attack Speed/,
		tiers: [
			{orig: [5, 7], conv: "$1% chance to gain Onslaught for 4 seconds on Hit", convRanges: [[8, 12]]},
			{orig: [8, 10], conv: "$1% chance to gain Onslaught for 4 seconds on Hit", convRanges: [[14, 18]]},
			{orig: [11, 13], conv: "$1% chance to gain Onslaught for 4 seconds on Hit", convRanges: [[20, 24]]},
			{orig: [14, 16], conv: "$1% chance to gain Onslaught for 4 seconds on Hit", convRanges: [[26, 30]]},
			{orig: [25, 25], conv: "Attack Skills have Added Lightning Damage equal to $1% of maximum Mana", convRanges: [[1, 5]]},
		],
	},
	{
		pattern: /\+(\d+) to Intelligence/,
		tiers: [
			{orig: [5, 8], conv: "$1% increased Cooldown Recovery Rate", convRanges: [[5, 8]]},
			{orig: [9, 12], conv: "$1% increased Cooldown Recovery Rate", convRanges: [[9, 12]]},
			{orig: [13, 16], conv: "$1% increased Cooldown Recovery Rate", convRanges: [[13, 16]]},
			{orig: [17, 20], conv: "$1% increased Cooldown Recovery Rate", convRanges: [[17, 20]]},
			{orig: [21, 24], conv: "$1% increased Cooldown Recovery Rate", convRanges: [[21, 24]]},
			{orig: [25, 27], conv: "$1% increased Cooldown Recovery Rate", convRanges: [[25, 28]]},
			{orig: [28, 30], conv: "$1% increased Cooldown Recovery Rate", convRanges: [[29, 32]]},
			{orig: [31, 33], conv: "10% increased Cooldown Recovery Rate"},
		],
	},
	{
		pattern: /(\d+)% increased Rarity of Items found/,
		tiers: [
			{orig: [6, 10], conv: "$1% increased Quantity of Gold Dropped by Slain Enemies", convRanges: [[15, 20]]},
			{orig: [11, 14], conv: "$1% increased Quantity of Gold Dropped by Slain Enemies", convRanges: [[21, 25]]},
			{orig: [15, 18], conv: "$1% increased Quantity of Gold Dropped by Slain Enemies", convRanges: [[26, 30]]},
		],
	},
	{
		pattern: /Gain (\d+) Life per enemy killed/,
		tiers: [
			{orig: [4, 6], conv: "Recover 1% of maximum Life on Kill"},
			{orig: [7, 9], conv: "Recover 1% of maximum Life on Kill"},
			{orig: [10, 18], conv: "Recover 1% of maximum Life on Kill"},
			{orig: [19, 28], conv: "Recover 2% of maximum Life on Kill"},
			{orig: [29, 40], conv: "Recover 2% of maximum Life on Kill"},
			{orig: [41, 53], conv: "Recover 2% of maximum Life on Kill"},
			{orig: [54, 68], conv: "Recover 2% of maximum Life on Kill"},
			{orig: [69, 84], conv: "Recover 3% of maximum Life on Kill"},
		],
	},
	{
		pattern: /Gain (\d+) Life per Enemy Hit with Attacks/,
		tiers: [
			{orig: [2, 2], conv: "Gain $1 Life per Enemy Hit with Attacks if you have dealt a Critical Hit Recently", convRanges: [[4, 6]]},
			{orig: [3, 3], conv: "Gain $1 Life per Enemy Hit with Attacks if you have dealt a Critical Hit Recently", convRanges: [[7, 9]]},
			{orig: [4, 4], conv: "Gain $1 Life per Enemy Hit with Attacks if you have dealt a Critical Hit Recently", convRanges: [[10, 12]]},
			{orig: [5, 5], conv: "Gain $1 Life per Enemy Hit with Attacks if you have dealt a Critical Hit Recently", convRanges: [[13, 15]]},
		],
	},
	{
		pattern: /Leech (\d+)% of Physical Attack Damage as Life/,
		tiers: [
			{orig: [5, 5.9], conv: "Leech $1% of Physical Attack Damage as Life\nLeech Life $2% slower", convRanges: [[8, 8.9], [20, 25]]},
			{orig: [6, 6.9], conv: "Leech $1% of Physical Attack Damage as Life\nLeech Life $2% slower", convRanges: [[9, 10.9], [20, 25]]},
			{orig: [7, 7.9], conv: "Leech $1% of Physical Attack Damage as Life\nLeech Life $2% slower", convRanges: [[11, 11.9], [20, 25]]},
			{orig: [8, 8.9], conv: "Leech $1% of Physical Attack Damage as Life\nLeech Life $2% slower", convRanges: [[12, 13.9], [20, 25]]},
			{orig: [9, 9.9], conv: "Leech $1% of Physical Attack Damage as Life\nLeech Life $2% slower", convRanges: [[14, 15], [20, 25]]},
		],
	},
	{
		pattern: /\+(\d+)% to Lightning Resistance/,
		tiers: [
			{orig: [6, 10], conv: "+1% to Maximum Lightning Resistance\n+$1% to Lightning Resistance", convRanges: [[11, 15]]},
			{orig: [11, 15], conv: "+1% to Maximum Lightning Resistance\n+$1% to Lightning Resistance", convRanges: [[16, 20]]},
			{orig: [16, 20], conv: "+1% to Maximum Lightning Resistance\n+$1% to Lightning Resistance", convRanges: [[21, 25]]},
			{orig: [21, 25], conv: "+2% to Maximum Lightning Resistance\n+$1% to Lightning Resistance", convRanges: [[21, 25]]},
			{orig: [26, 30], conv: "+2% to Maximum Lightning Resistance\n+$1% to Lightning Resistance", convRanges: [[26, 30]]},
			{orig: [31, 35], conv: "+2% to Maximum Lightning Resistance\n+$1% to Lightning Resistance", convRanges: [[31, 35]]},
			{orig: [36, 40], conv: "+2% to Maximum Lightning Resistance\n+$1% to Lightning Resistance", convRanges: [[36, 40]]},
			{orig: [41, 45], conv: "+3% to Maximum Lightning Resistance\n+$1% to Lightning Resistance", convRanges: [[36, 40]]},
		],
	},
	{
		pattern: /Gain (\d+) Mana per enemy killed/,
		tiers: [
			{orig: [2, 3], conv: "Recover 1% of maximum Mana on Kill"},
			{orig: [4, 5], conv: "Recover 1% of maximum Mana on Kill"},
			{orig: [6, 9], conv: "Recover 1% of maximum Mana on Kill"},
			{orig: [10, 14], conv: "Recover 2% of maximum Mana on Kill"},
			{orig: [15, 20], conv: "Recover 2% of maximum Mana on Kill"},
			{orig: [21, 27], conv: "Recover 2% of maximum Mana on Kill"},
			{orig: [28, 35], conv: "Recover 2% of maximum Mana on Kill"},
			{orig: [36, 45], conv: "Recover 3% of maximum Mana on Kill"},
		],
	},
	{
		pattern: /Projectiles have (\d+)% chance to Chain an additional time from terrain/,
		tiers: [
			{orig: [10, 19], conv: "Attacks Chain an additional time"},
			{orig: [20, 32], conv: "Attacks Chain 2 additional times"},
		],
	},
	{
		pattern: /Projectiles have (\d+)% chance for an additional Projectile when Forking/,
		tiers: [
			{orig: [25, 50], conv: "Projectiles have $1% chance to Fork if you've dealt a Melee Hit in the past eight seconds", convRanges: [[45, 64]]},
			{orig: [51, 100], conv: "Projectiles have $1% chance to Fork if you've dealt a Melee Hit in the past eight seconds", convRanges: [[65, 85]]},
		],
	},
	{
		pattern: /(\d+)% increased Critical Hit Chance/,
		tiers: [
			{orig: [16, 21], conv: "Hits against you have $1% reduced Critical Damage Bonus", convRanges: [[30, 39]]},
			{orig: [22, 27], conv: "Hits against you have $1% reduced Critical Damage Bonus", convRanges: [[40, 49]]},
			{orig: [28, 34], conv: "Hits against you have $1% reduced Critical Damage Bonus", convRanges: [[50, 60]]},
		],
	},
	{
		pattern: /Mark Skills have (\d+)% increased Skill Effect Duration/,
		tiers: [
			{orig: [50, 74], conv: "When your Marks are Consumed, they have $1% chance to Mark another Enemy within 3 metres", convRanges: [[10, 19]]},
			{orig: [75, 100], conv: "When your Marks are Consumed, they have $1% chance to Mark another Enemy within 3 metres", convRanges: [[20, 29]]},
		],
	},
	{
		pattern: /\+(\d+) to Level of all Mark Skills/,
		tiers: [
			{orig: [1, 2], conv: "Enemies you Mark take $1% increased Damage", convRanges: [[1, 5]]},
			{orig: [3, 4], conv: "Enemies you Mark take $1% increased Damage", convRanges: [[6, 10]]},
		],
	},
	{
		pattern: /Mark Skills have (\d+)% increased Use Speed/,
		tiers: [
			{orig: [13, 23], conv: "$1% increased Damage with Hits against Marked Enemy", convRanges: [[10, 19]]},
			{orig: [24, 39], conv: "$1% increased Damage with Hits against Marked Enemy", convRanges: [[20, 29]]},
		],
	},
	{
		pattern: /\+(\d+) to Level of all Projectile Skills/,
		tiers: [
			{orig: [1, 1], conv: "Projectiles have $1% chance to Fork", convRanges: [[25, 44]]},
			{orig: [2, 2], conv: "Projectiles have $1% chance to Fork", convRanges: [[45, 65]]},
		],
	},
	{
		pattern: /\+(\d+)% Surpassing chance to fire an additional Projectile/,
		tiers: [
			{orig: [23, 36], conv: "Projectiles have $1% chance to Shock", convRanges: [[15, 20]]},
			{orig: [37, 50], conv: "Projectiles have $1% chance to Shock", convRanges: [[21, 25]]},
			{orig: [51, 66], conv: "Projectiles have $1% chance to Shock", convRanges: [[26, 30]]},
		],
	},
	{
		pattern: /(\d+)% reduced Attribute Requirements/,
		tiers: [
			{orig: [15, 15], conv: "+$1 to all Attributes", convRanges: [[5, 10]]},
			{orig: [20, 20], conv: "+$1 to all Attributes", convRanges: [[11, 15]]},
			{orig: [25, 25], conv: "+$1 to all Attributes", convRanges: [[16, 20]]},
			{orig: [30, 30], conv: "+$1 to all Attributes", convRanges: [[21, 25]]},
			{orig: [35, 35], conv: "+$1 to all Attributes", convRanges: [[26, 30]]},
		],
	},
	{
		pattern: /\+(\d+) to Strength/,
		tiers: [
			{orig: [5, 8], conv: "$1% increased Area of Effect for Attacks", convRanges: [[7, 10]]},
			{orig: [9, 12], conv: "$1% increased Area of Effect for Attacks", convRanges: [[11, 13]]},
			{orig: [13, 16], conv: "$1% increased Area of Effect for Attacks", convRanges: [[14, 16]]},
			{orig: [17, 20], conv: "$1% increased Area of Effect for Attacks", convRanges: [[17, 19]]},
			{orig: [21, 24], conv: "$1% increased Area of Effect for Attacks", convRanges: [[20, 22]]},
			{orig: [25, 27], conv: "$1% increased Area of Effect for Attacks", convRanges: [[23, 25]]},
			{orig: [28, 30], conv: "$1% increased Area of Effect for Attacks", convRanges: [[26, 28]]},
			{orig: [31, 33], conv: "$1% increased Area of Effect for Attacks", convRanges: [[29, 32]]},
		],
	},
	{
		pattern: /(\d+)% increased Magnitude of Chill you inflict/,
		tiers: [
			{orig: [20, 40], conv: "$1% chance to Avoid being Chilled", convRanges: [[20, 50]]},
		],
	},
	{
		pattern: /(\d+)% increased Damage per Curse on you/,
		tiers: [
			{orig: [10, 15], conv: "$1% increased Damage with Hits per Curse on Enemy", convRanges: [[10, 20]]},
		],
	},
	{
		pattern: /(\d+)% increased Freeze Duration on Enemies/,
		tiers: [
			{orig: [10, 20], conv: "Regenerate $1% of maximum Life per second while Frozen", convRanges: [[5, 15]]},
		],
	},
	{
		pattern: /(\d+)% Global chance to Blind Enemies on Hit/,
		tiers: [
			{orig: [5, 10], conv: "Dazes on Hit"},
		],
	},
	{
		pattern: /\+(\d+) to Level of all Chaos Skills/,
		tiers: [
			{orig: [1, 1], conv: "Attacks have added Chaos damage equal to $1% of maximum Life", convRanges: [[1, 3]]},
		],
	},
	{
		pattern: /(\d+)% increased maximum Life/,
		tiers: [
			{orig: [5, 10], conv: "+$1 to maximum Life", convRanges: [[205, 221]]},
		],
	},
	{
		pattern: /\+(\d+) maximum Rage if you've used a Skill that Requires Glory in the past (\d+) seconds/,
		tiers: [
			{orig: [8, 10], conv: "Gain $1 Rage on Melee Hit", convRanges: [[1, 3]]},
		],
	},
	{
		pattern: /(\d+)% chance that if you would gain Rage on Hit, you instead gain up to your maximum Rage/,
		tiers: [
			{orig: [12, 16], conv: "Gain 1% of Physical Damage as Extra Fire Damage per Rage"},
		],
	},
	{
		pattern: /(\d+)% increased Duration of Poisons you inflict when you've consumed a Frenzy Charge Recently/,
		tiers: [
			{orig: [30, 40], conv: "$1% increased Damage for each Poison on you up to a maximum of 75%\nPoison you inflict is Reflected to you", convRanges: [[20, 35]]},
		],
	},
	{
		pattern: /(\d+)% increased Magnitude of Poison you inflict on targets that are not Poisoned/,
		tiers: [
			{orig: [30, 60], conv: "$1% reduced Poison Duration on you", convRanges: [[10, 60]]},
		],
	},
	{
		pattern: /Recover (\d+)% of maximum Life per Poison affecting Enemies you Kill/,
		tiers: [
			{orig: [0.5, 1], conv: "+$1% to Chaos Resistance per Poison on you\nPoison you inflict is Reflected to you", convRanges: [[12, 23]]},
		],
	},
	{
		pattern: /(\d+)% reduced Poison Duration on you/,
		tiers: [
			{orig: [40, 60], conv: "$1% increased Movement Speed for each Poison on you up to a maximum of 50%\nPoison you inflict is Reflected to you", convRanges: [[17, 25]]},
		],
	},
	{
		pattern: /(\d+)% increased Magnitude of Shock you inflict/,
		tiers: [
			{orig: [20, 40], conv: "$1% chance to Avoid being Shocked", convRanges: [[20, 50]]},
		],
	},
];

function stripMarkup(line) {
	return line.replace(/\[([^|\]]+)\|([^\]]+)\]/g, '$2').replace(/\[([^\]]+)\]/g, '$1');
}

function transformGloveText(text) {
	let lines = text.split('\n');
	let result = [];
	for (let i = 0; i < lines.length; i++) {
		let line = stripMarkup(lines[i]);
		let matched = false;
		for (let mapping of mappings) {
			let isMultiLine = mapping.pattern.source.includes('\\n');
			let testStr = line;
			if (isMultiLine && i + 1 < lines.length) {
				let numNewlines = (mapping.pattern.source.match(/\\n/g) || []).length;
				let combined = [line];
				for (let j = 1; j <= numNewlines && i + j < lines.length; j++) {
					combined.push(stripMarkup(lines[i + j]));
				}
				testStr = combined.join('\n');
			}
			let m = mapping.pattern.exec(testStr);
			if (!m) continue;
			let captureIdx = mapping.tierCapture || 1;
			let value = parseFloat(m[captureIdx]);
			let tier = mapping.tiers.find(t => value >= t.orig[0] && value <= t.orig[1]);
			if (!tier) continue;
			let conv = tier.conv;
			if (tier.convRanges) {
				let roundTo = (r) => {
					let decimals = Math.max(
						(String(r[0]).split('.')[1] || '').length,
						(String(r[1]).split('.')[1] || '').length
					);
					return v => +(v.toFixed(decimals));
				};
				if (tier.orig[0] !== tier.orig[1]) {
					let t = (value - tier.orig[0]) / (tier.orig[1] - tier.orig[0]);
					conv = conv.replace(/\$(\d+)/g, (_, n) => {
						let r = tier.convRanges[parseInt(n) - 1];
						return roundTo(r)(r[0] + t * (r[1] - r[0]));
					});
				} else {
					conv = conv.replace(/\$(\d+)/g, (_, n) => {
						let r = tier.convRanges[parseInt(n) - 1];
						return roundTo(r)((r[0] + r[1]) / 2);
					});
				}
			}
			if (isMultiLine) {
				let numNewlines = (mapping.pattern.source.match(/\\n/g) || []).length;
				i += numNewlines;
			}
			result.push(...conv.split('\n'));
			matched = true;
			break;
		}
		if (!matched) result.push(lines[i]);
	}
	return result.join('\n');
}

module.exports = {transformGloveText, mappings};

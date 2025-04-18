// maps from item text: 'Item Class: ...'
// todo[low] don't seem to get any errors when these are mapped incorrectly
const itemClassToPobType = {
	'Rings': 'Ring',
	'Quivers': 'Quiver',
	'Boots': 'Boots',
	'Amulets': 'Amulet',
	'Body Armours': 'Body Armour',
	'Helmets': 'Helmet',
	'Gloves': 'Gloves',
	'Belts': 'Belt',
	'Shields': 'Shield',
	'Foci': 'Focus',
	'Bucklers': 'Shield',
	'Bows': 'Bow',
	'Crossbows': 'Crossbow',
	'Claws': 'Claw',
	'Spears': 'Spear',
	'Flails': 'Flail',
	'Staves': 'Staff',
	'Warstaves': 'Staff',
	'One Hand Maces': 'One Handed Mace',
	'One Hand Swords': 'One Handed Sword',
	'Sceptres': 'Sceptre',
	'Thrusting One Hand Swords': 'Thrusting One Handed Sword',
	'Wands': 'Wand',
	'Two Hand Axes': 'Two Handed Axe',
	'Two Hand Swords': 'Two Handed Sword',
	'Two Hand Maces': 'Two Handed Mace',
	'Daggers': 'Dagger',
	'Rune Daggers': 'Dagger',
	'One Hand Axes': 'One Handed Axe',
	'Utility Flasks': 'Flask',
};

// maps from trade site types
const tradeClassToPobType = type => {
	let map = {
		'Buckler': 'Shield',
		'Quarterstaff': 'Staff',
	};
	return map[type] || type;
};

module.exports = {itemClassToPobType, tradeClassToPobType};

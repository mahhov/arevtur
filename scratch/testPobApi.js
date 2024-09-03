const pobApi = require('../src/pobApi/pobApi');
// let pobApi = new pobApi('C:\\Users\\placeholder\\Downloads\\PathOfBuilding-1.4.170\\');
// pobApi.build =
// 	'C:/Users/placeholder/Documents/Path of Building/Builds/traickster brand harvest.xml';
// pobApi.ready.then(() => console.log('ready'));

// let p = [];
// for (let i = 0; i < 100; i++) {
// 	let pp = pobApi.evalItemModSummary('+10 total maximum Life').then(a => {
// 		// console.log(a)
// 		// console.log(a.text.match(/Small Life Flask/gi).length)
// 		// if (a.text.match(/Small Life Flask/gi).length > 1)
// 		// 	console.log('')
// 	});
// 	p.push(pp);
// }
// Promise.all(p).then(() => console.log('done'))

// pobApi.evalItemModSummary('30% increased Spell Damage').then(a => console.log(a));

// pobApi.evalItemModSummary('30% increased cast speed').then(a => console.log(a));
// pobApi.evalItemModSummary('+56 to maximum Life').then(a => console.log(a));
// pobApi.evalItemModSummary('+51 to maximum Mana').then(a => console.log(a));
// pobApi.evalItemModSummary('+45% to Lightning Resistance').then(a => console.log(a));
// pobApi.evalItem(PobApi.decode64('UmFyaXR5OiBSYXJlDQpBcG9jYWx5cHNlIENpcmNsZQ0KVG9wYXogUmluZw0KLS0tLS0tLS0NClJlcXVpcmVtZW50czoNCkxldmVsOiA2Mw0KLS0tLS0tLS0NCkl0ZW0gTGV2ZWw6IDc5DQotLS0tLS0tLQ0KKzIwJSB0byBMaWdodG5pbmcgUmVzaXN0YW5jZSAoaW1wbGljaXQpDQotLS0tLS0tLQ0KKzQ3IHRvIFN0cmVuZ3RoDQorNzQgdG8gbWF4aW11bSBMaWZlDQorNDMgdG8gbWF4aW11bSBNYW5hDQo2MyUgaW5jcmVhc2VkIE1hbmEgUmVnZW5lcmF0aW9uIFJhdGUNCg==')).then(a
// => console.log(a));


pobApi.pobPath =
	'/var/lib/flatpak/app/community.pathofbuilding.PathOfBuilding/current/active/files/pathofbuilding/src';
pobApi.build =
	'~/.var/app/community.pathofbuilding.PathOfBuilding/data/pobfrontend/Path of Building/Builds/cobra lash.xml';
pobApi.valueParams = {life: .5, resist: .1, dps: .25};

let p = pobApi.evalItem([
		'Item Class: Stackable Currency',
		'Rarity: Currency',
		'Wailing Essence of Suffering',
		'--------',
		'Stack Size: 1/9',
		'--------',
		'Upgrades a normal item to rare with one guaranteed property',
		'Properties restricted to level 75 and below',
		'',
		'One Handed Weapon: Adds (20-26) to (40-46) Cold Damage to Spells',
		'Two Handed Weapon: Adds (30-40) to (59-69) Cold Damage to Spells',
		'Gloves: Adds (5-7) to (10-12) Cold Damage to Attacks',
		'Body Armour: (6-7)% chance to Avoid Cold Damage from Hits',
		'Shield: (6-7)% chance to Avoid Cold Damage from Hits',
		'Other Armour: (43-46)% chance to Avoid being Frozen',
		'Quiver: Adds (15-20) to (30-35) Cold Damage to Attacks',
		'Belt: (43-46)% chance to Avoid being Frozen',
		'Other Jewellery: Adds (10-13) to (20-24) Cold Damage to Attacks',
		'--------',
		'Right click this item then left click a normal item to apply it.',
	].join('\n'),
);

p.then(r => console.log(r)).catch(e => console.log(e));

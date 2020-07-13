const axios = require('axios');
const Parallel = require('./Parallel');
const Stream = require('../arevtur/Stream');

let clean = str =>
	str
		.replace(/&ndash;/g, '-')
		.replace(/<[^>]+>/g, ' ');

let getUncachedModsByItem = () => {
	let endpointPrefix = 'https://poedb.tw/us/json.php/Mods/Gen?';
	let endpointPaths = [
		'cn=Claw',
		'cn=Dagger',
		'cn=Wand',
		'cn=One+Hand+Sword',
		'cn=Thrusting+One+Hand+Sword',
		'cn=One+Hand+Axe',
		'cn=One+Hand+Mace',
		'cn=Sceptre',
		'cn=Rune+Dagger',
		'cn=Bow',
		'cn=Staff',
		'cn=Two+Hand+Sword',
		'cn=Two+Hand+Axe',
		'cn=Two+Hand+Mace',
		'cn=Warstaff',
		'cn=BaseItemTypes&an=Crimson+Jewel',
		'cn=BaseItemTypes&an=Viridian+Jewel',
		'cn=BaseItemTypes&an=Cobalt+Jewel',
		'cn=BaseItemTypes&an=Prismatic+Jewel',
		'cn=BaseItemTypes&an=Murderous+Eye+Jewel',
		'cn=BaseItemTypes&an=Searching+Eye+Jewel',
		'cn=BaseItemTypes&an=Hypnotic+Eye+Jewel',
		'cn=BaseItemTypes&an=Ghastly+Eye+Jewel',
		'cn=BaseItemTypes&an=Large+Cluster+Jewel',
		'cn=BaseItemTypes&an=Medium+Cluster+Jewel',
		'cn=BaseItemTypes&an=Small+Cluster+Jewel',
		'cn=Amulet',
		'cn=Ring',
		'cn=Ring&tags=unset_ring',
		'cn=Belt',
		'cn=Gloves&tags=str_armour',
		'cn=Gloves&tags=dex_armour',
		'cn=Gloves&tags=int_armour',
		'cn=Gloves&tags=str_dex_armour',
		'cn=Gloves&tags=str_int_armour',
		'cn=Gloves&tags=dex_int_armour',
		'cn=Boots&tags=str_armour',
		'cn=Boots&tags=dex_armour',
		'cn=Boots&tags=int_armour',
		'cn=Boots&tags=str_dex_armour',
		'cn=Boots&tags=str_int_armour',
		'cn=Boots&tags=dex_int_armour',
		'cn=Body+Armour&tags=str_armour',
		'cn=Body+Armour&tags=dex_armour',
		'cn=Body+Armour&tags=int_armour',
		'cn=Body+Armour&tags=str_dex_armour',
		'cn=Body+Armour&tags=str_int_armour',
		'cn=Body+Armour&tags=dex_int_armour',
		'cn=Body+Armour&tags=str_dex_int_armour',
		'cn=Helmet&tags=str_armour',
		'cn=Helmet&tags=dex_armour',
		'cn=Helmet&tags=int_armour',
		'cn=Helmet&tags=str_dex_armour',
		'cn=Helmet&tags=str_int_armour',
		'cn=Helmet&tags=dex_int_armour',
		'cn=Quiver',
		'cn=Shield&tags=str_armour,str_shield', // todo shields
		'cn=LifeFlask',
		'cn=ManaFlask',
		'cn=HybridFlask',
		'cn=UtilityFlask',
		'cn=UtilityFlaskCritical',
		'cn=BaseItemTypes&an=Convoking+Wand',
	];

	let parallel = new Parallel(20);
	let progressStream = new Stream();
	let progressCount = 0;
	let timeResolve, time = new Promise(resolve => timeResolve = resolve);

	let modsByItem = Promise.all(endpointPaths.map(async endpointPath => {
		let data = (await parallel.add(() => axios.get(`${endpointPrefix}${endpointPath}`))).data;
		let item = [
			data.baseitem.Code,
			data.baseitem.cn,
			data.baseitem.tags,
		].filter(text => text).join(' ');
		let modsByCategory = Object.keys(data.config).map(category => {
			let mods = data[category] || [];
			if (!mods.length)
				mods = Object.values(mods);
			mods = mods.map(mod => ({
				group: mod.CorrectGroup,
				suffix: mod.ModGenerationTypeID === "2",
				text: clean(mod.str),
				tags: mod.mod_no.map(tag => clean(tag)).filter((v, i, a) => a.indexOf(v) === i),
				weight: Number(mod.DropChance) || 0,
				levelRequirement: Number(mod.Level),
				name: clean(mod.Name || ''),
			}));
			let modsByGroup = Object.entries(mods.reduce((modsByGroup, mod) => {
				modsByGroup[mod.group] = modsByGroup[mod.group] || [];
				modsByGroup[mod.group].push(mod);
				return modsByGroup;
			}, {})).map(([group, mods]) => ({
				group,
				suffix: mods[mods.length - 1].suffix,
				text: mods[mods.length - 1].text,
				tags: mods.flatMap(mod => mod.tags).filter((v, i, a) => a.indexOf(v) === i),
				weight: mods.reduce((sum, mod) => sum + mod.weight, 0),
				levelRequirement: Math.min(...mods.map(mod => mod.levelRequirement)),
				mods,
			}));
			return {category, modsByGroup};
		});
		progressStream.write(++progressCount / endpointPaths.length);
		return {item, modsByCategory};
	}));

	modsByItem.then(modsByItem => {
		progressStream.done();
		let timeStr = new Date().toLocaleString('en-US', {dateStyle: 'short', timeStyle: 'short'});
		timeResolve(timeStr);
		localStorage.setItem('modsByItem', JSON.stringify(modsByItem));
		localStorage.setItem('modsByItemTime', timeStr);
	});
	return {modsByItem, progressStream, time};
};

let getModsByItem = (forceUncached = false) => {
	let modsByItem, progressStream, time;

	if (!forceUncached && (modsByItem = localStorage.getItem('modsByItem'))) {
		modsByItem = Promise.resolve(JSON.parse(modsByItem));
		progressStream = new Stream();
		progressStream.done();
		time = Promise.resolve(localStorage.getItem('modsByItemTime'));
	} else
		({modsByItem, progressStream, time} = getUncachedModsByItem());

	return {modsByItem, progressStream, time};
};

// const sampleData = require('../../resources/sampleModViewerData');
// if (sampleData)
// 	modsByItem = Promise.resolve(sampleData);

module.exports = {getModsByItem};

/*
	[{
		item: '',
		modsByCategory: [{
			category: '',
			modsByGroup: [{
				group: '',
				suffix: '',
				text: '',
				tags: [''],
				weight: 0,
				levelRequirement: 0,
				mods: [{
					group: '',
					suffix: false,
					text: '',
					tags: [''],
					weight: 0,
					levelRequirement: 0,
					name: '',
				}]
			}]
		}]
	}]
*/

const apiConstants = require('./apiConstants');
const Searcher = require('../util/Searcher');
const pobApi = require('../services/pobApi/pobApi');
const UnifiedQueryParams = require('./UnifiedQueryParams');
const configForRenderer = require('../services/config/configForRenderer');

class Macros {
	static Input = {
		removeWeightedEntries: async (unifiedQueryParams, asyncFilter) => {
			let filtered = [];
			for (let weightEntry of unifiedQueryParams.weightEntries)
				if (await asyncFilter(weightEntry))
					filtered.push(weightEntry);
			unifiedQueryParams.weightEntries = filtered;
			return unifiedQueryParams;
		},

		dropImplicits: async unifiedQueryParams => {
			return Macros.Input.removeWeightedEntries(unifiedQueryParams, async weightEntry =>
				(await weightEntry.property)?.type !== 'implicit');
		},

		replaceResists: async unifiedQueryParams => {
			let searcher = new Searcher(
				'= +#% #% total to all and cold fire lightning chaos elemental resistance resistances (explicit) (implicit)');
			await Macros.Input.removeWeightedEntries(unifiedQueryParams, async weightEntry =>
				!searcher.test((await weightEntry.property)?.originalText));

			(configForRenderer.config.version2 ? [
				['#% to Cold Resistance (implicit)', pobApi.weights.elementalResist],
				['#% to Cold Resistance (explicit)', pobApi.weights.elementalResist],
				['#% to Fire Resistance (implicit)', pobApi.weights.elementalResist],
				['#% to Fire Resistance (explicit)', pobApi.weights.elementalResist],
				['#% to Lightning Resistance (implicit)', pobApi.weights.elementalResist],
				['#% to Lightning Resistance (explicit)', pobApi.weights.elementalResist],
				['#% to all Elemental Resistances (implicit)', pobApi.weights.elementalResist * 3],
				['#% to all Elemental Resistances (explicit)', pobApi.weights.elementalResist * 3],
				['#% to Chaos Resistance (explicit)', pobApi.weights.elementalResist],
				['#% to Chaos Resistance (implicit)', pobApi.weights.chaosResist],
			] : [
				['+#% total to all Elemental Resistances (pseudo)', pobApi.weights.elementalResist],
				['+#% total to Chaos Resistance (pseudo)', pobApi.weights.chaosResist],
			])
				.filter(tuple => tuple[1])
				.forEach(tuple => unifiedQueryParams.weightEntries.unshift(new UnifiedQueryParams.Entry(...tuple)));

			return unifiedQueryParams;
		},

		replaceAttributes: async unifiedQueryParams => {
			let searchers = ['strength', 'dexterity', 'intelligence'].map(
				attribute => new Searcher(`
				${attribute}`));
			for (let searcher of searchers) {
				await Macros.Input.removeWeightedEntries(unifiedQueryParams, async weightEntry =>
					!searcher.test((await weightEntry.property)?.originalText));
			}

			// todo[medium] should be adding to any weight already assigned so to include e.g. the value of life given from str.
			(configForRenderer.config.version2 ? [
				['# to Strength (implicit)', pobApi.weights.str],
				['# to Strength (explicit)', pobApi.weights.str],
				['# to Dexterity (implicit)', pobApi.weights.dex],
				['# to Dexterity (explicit)', pobApi.weights.dex],
				['# to Intelligence (implicit)', pobApi.weights.int],
				['# to Intelligence (explicit)', pobApi.weights.int],
			] : [
				['+# total to Strength (pseudo)', pobApi.weights.str],
				['+# total to Dexterity (pseudo)', pobApi.weights.dex],
				['+# total to Intelligence (pseudo)', pobApi.weights.int],
			])
				.filter(tuple => tuple[1])
				.forEach(tuple => unifiedQueryParams.weightEntries.unshift(new UnifiedQueryParams.Entry(...tuple)));
			return unifiedQueryParams;
		},

		addCrafted: async unifiedQueryParams => {
			// remove existing crafted properties
			await Macros.Input.removeWeightedEntries(unifiedQueryParams, async weightEntry =>
				(await weightEntry.property)?.type !== 'crafted');

			// add crafted properties using explicit mods' weights
			let craftedProperties = await apiConstants.propertiesByType('crafted');
			await Promise.all(unifiedQueryParams.weightEntries.map(async weightEntry => {
				let weightedProperty = await weightEntry.property;
				if (weightedProperty.type !== 'explicit') return;

				let craftedProperty = craftedProperties.find(craftedProperty =>
					craftedProperty.originalText === weightedProperty.originalText);
				if (!craftedProperty) return;

				unifiedQueryParams.weightEntries.push(
					new UnifiedQueryParams.Entry(craftedProperty.text, weightEntry.weight));
			}));

			return unifiedQueryParams;
		},

		// todo[high] add PoB weights to crafted and pseudo mods
		// todo[medium] this can leave double counted mods. e.g. it'll replace '% attack speed
		//  (implicit|explicit)' with the pseudo version, but it'll leave '% attack & cast speed
		//  (implicit|explicit)'.
		addPseudo: async unifiedQueryParams => {
			let pseudoProperties = await apiConstants.propertiesByType('pseudo');
			let explicitProperties = await apiConstants.propertiesByType('explicit');
			let implicitProperties = await apiConstants.propertiesByType('implicit');
			let craftedProperties = await apiConstants.propertiesByType('crafted');
			pseudoProperties
				.map(pseudoProperty => {
					let cleanedOriginalTexts = [
						pseudoProperty.originalText,
						pseudoProperty.originalText.replace('total ', 'to '),
						pseudoProperty.originalText.replace('total ', ''),
						pseudoProperty.originalText
							.replace('total ', 'increased ')
							.replace('+', ''),
					];
					let matchingProperties = [
						explicitProperties,
						implicitProperties,
						craftedProperties,
					]
						.flat()
						.filter(otherProperty =>
							cleanedOriginalTexts.some(cleanedOriginalText =>
								otherProperty.originalText === cleanedOriginalText));
					matchingProperties.push(pseudoProperty);
					return {pseudoProperty, matchingProperties};
				})
				.filter(({_, matchingProperties}) => matchingProperties.length > 2)
				.forEach(({pseudoProperty, matchingProperties}) => {
					let weightEntries = unifiedQueryParams.weightEntries.filter(weightEntry =>
						matchingProperties.some(
							property => property.text === weightEntry.propertyText));
					if (weightEntries.length <= 1) return;
					let weight = Math.max(...weightEntries.map(weightEntry => weightEntry.weight));
					unifiedQueryParams.weightEntries = unifiedQueryParams.weightEntries
						.filter(weightEntry => !weightEntries.includes(weightEntry));
					unifiedQueryParams.weightEntries.unshift(
						new UnifiedQueryParams.Entry(pseudoProperty.text, weight));
				});
			return unifiedQueryParams;
		},

		enableAll: unifiedQueryParams => {
			let entries = [
				unifiedQueryParams.weightEntries,
				unifiedQueryParams.andEntries,
				unifiedQueryParams.notEntries,
				unifiedQueryParams.conditionalPrefixEntries,
				unifiedQueryParams.conditionalSuffixEntries,
				unifiedQueryParams.sharedWeightEntries,
			].flat();
			entries.forEach(entry => entry.enabled = true);
			return unifiedQueryParams;
		},

		enableAllForItemType: async (unifiedQueryParams, itemType) => {
			let mods = await apiConstants.propertiesByItemType(itemType);
			[
				unifiedQueryParams.weightEntries,
				unifiedQueryParams.andEntries,
				unifiedQueryParams.notEntries,
				unifiedQueryParams.conditionalPrefixEntries,
				unifiedQueryParams.conditionalSuffixEntries,
				unifiedQueryParams.sharedWeightEntries,
			].flat().forEach(entry => {
				let propertyText = entry.propertyText
					.replaceAll(/\[.*?([^|]*?)]/g, '$1')
					.replaceAll(/ \(.*\)$/g, '');
				entry.enabled = mods.includes(propertyText);
			});
			return unifiedQueryParams;
		},

		shareAll: unifiedQueryParams => {
			let entries = [
				unifiedQueryParams.weightEntries,
				unifiedQueryParams.sharedWeightEntries,
			].flat();
			let shared = unifiedQueryParams.weightEntries.length;
			unifiedQueryParams.sharedWeightEntries = shared ? entries : [];
			unifiedQueryParams.weightEntries = shared ? [] : entries;
			return unifiedQueryParams;
		},

		removeUnshared: unifiedQueryParams => {
			unifiedQueryParams.weightEntries = [];
			unifiedQueryParams.andEntries = [];
			unifiedQueryParams.notEntries = [];
			unifiedQueryParams.conditionalPrefixEntries = [];
			unifiedQueryParams.conditionalSuffixEntries = [];
			return unifiedQueryParams;
		},

		// todo[medium] macro to accept 2nd column of pob weights
	};

	static Output = {};
}

module.exports = Macros;

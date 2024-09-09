const apiConstants = require('./apiConstants');
const Searcher = require('../util/Searcher');
const pobApi = require('../services/pobApi/pobApi');

class Macros {
	static Input = {
		removeWeightedEntries: async (unifiedQueryParams, asyncFilter) => {
			let filtered = [];
			for (let weightEntry of unifiedQueryParams.weightEntries)
				if (await asyncFilter(weightEntry[0]))
					filtered.push(weightEntry);
			unifiedQueryParams.weightEntries = filtered;
			return unifiedQueryParams;
		},

		dropImplicits: async unifiedQueryParams => {
			return Macros.Input.removeWeightedEntries(unifiedQueryParams, async propertyId =>
				(await apiConstants.propertyById(propertyId))?.type !== 'implicit');
		},

		replaceResists: async unifiedQueryParams => {
			let searcher = new Searcher(
				'= +#% total to all and cold fire lightning chaos elemental resistance resistances');
			await Macros.Input.removeWeightedEntries(unifiedQueryParams, async propertyId =>
				!searcher.test(
					(await apiConstants.propertyById(propertyId))?.originalText));
			if (pobApi.weights.elementalResist)
				unifiedQueryParams.weightEntries.unshift(
					['pseudo.pseudo_total_all_elemental_resistances',
						pobApi.weights.elementalResist,
						false,
						false]);
			if (pobApi.weights.chaosResist)
				unifiedQueryParams.weightEntries.unshift(
					['pseudo.pseudo_total_chaos_resistance',
						pobApi.weights.chaosResist,
						false,
						false]);
			return unifiedQueryParams;
		},

		replaceAttributes: async unifiedQueryParams => {
			let searchers = ['strength', 'dexterity', 'intelligence'].map(
				attribute => new Searcher(`+# to !gem !passive !per !while !with ${attribute}`));
			for (let searcher of searchers) {
				await Macros.Input.removeWeightedEntries(unifiedQueryParams, async propertyId =>
					!searcher.test(
						(await apiConstants.propertyById(propertyId))?.originalText));
			}
			[
				['pseudo.pseudo_total_strength', pobApi.weights.str],
				['pseudo.pseudo_total_dexterity', pobApi.weights.dex],
				['pseudo.pseudo_total_intelligence', pobApi.weights.int],
			]
				.filter(tuple => tuple[1])
				.forEach(tuple =>
					unifiedQueryParams.weightEntries.unshift([...tuple, false, false]));
			return unifiedQueryParams;
		},

		addCrafted: async unifiedQueryParams => {
			// remove existing crafted properties
			await Macros.Input.removeWeightedEntries(unifiedQueryParams, async propertyId =>
				(await apiConstants.propertyById(propertyId)).type !== 'crafted');

			// add crafted properties using explicit mods' weights
			let craftedProperties = await apiConstants.propertiesByType('crafted');
			await Promise.all(unifiedQueryParams.weightEntries.map(async weightEntry => {
				let weightedProperty = (await apiConstants.propertyById(weightEntry[0]));
				if (weightedProperty.type !== 'explicit') return;

				let craftedProperty = craftedProperties.find(craftedProperty =>
					craftedProperty.originalText === weightedProperty.originalText);
				if (!craftedProperty) return;

				unifiedQueryParams.weightEntries.push(
					[craftedProperty.id, weightEntry[1], false, true]);
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
						matchingProperties.some(property => property.id === weightEntry[0]));
					if (weightEntries.length <= 1) return;
					let weight = Math.max(...weightEntries.map(weightEntry => weightEntry[1]));
					unifiedQueryParams.weightEntries = unifiedQueryParams.weightEntries
						.filter(weightEntry => !weightEntries.includes(weightEntry));
					unifiedQueryParams.weightEntries.unshift(
						[pseudoProperty.id, weight, false, true]);
				});
			return unifiedQueryParams;
		},

		enableAll: unifiedQueryParams => {
			unifiedQueryParams.weightEntries.forEach(weightEntry =>
				weightEntry[3] = true);
			unifiedQueryParams.andEntries.forEach(weightEntry =>
				weightEntry[3] = true);
			unifiedQueryParams.notEntries.forEach(weightEntry =>
				weightEntry[1] = true);
			unifiedQueryParams.conditionalPrefixEntries.forEach(weightEntry =>
				weightEntry[3] = true);
			unifiedQueryParams.conditionalSuffixEntries.forEach(weightEntry =>
				weightEntry[3] = true);
			unifiedQueryParams.sharedWeightEntries.forEach(weightEntry =>
				weightEntry[3] = true);
			return unifiedQueryParams;
		},
	};

	static Output = {};
}

module.exports = Macros;

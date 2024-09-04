const apiConstants = require('./apiConstants');
const Searcher = require('../util/Searcher');
const pobApi = require('../pobApi/pobApi');

class Macros {
	static  Input = {
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
			// /(\+#%|total|to|all|and|cold|fire|lightning|chaos|elemental|resistances?|\s)+/
			let searcher = new Searcher(
				'= +#% total to all and cold fire lightning chaos elemental resistance resistances');
			await Macros.Input.removeWeightedEntries(unifiedQueryParams, async propertyId =>
				!searcher.test(
					(await apiConstants.propertyById(propertyId))?.originalText));
			if (pobApi.weights.resist)
				unifiedQueryParams.weightEntries.push(
					['pseudo.pseudo_total_resistance', pobApi.weights.resist, false, false]);
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
				.forEach(tuple => unifiedQueryParams.weightEntries.push([...tuple, false, false]));
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

// ^\+#% to .*resist
// !maximum

class Filter {
	// operator filters

	static and = (...filters) =>
		item => filters.every(filter => filter(item));

	static or = (...filters) =>
		item => filters.some(filter => filter(item));

	static not = filter =>
		item => !filter(item);

	// primitive filters

	static itemClass = itemClass =>
		item => item.itemClass === itemClass;

	static itemRarity = itemRarity =>
		item => item.itemRarity === itemRarity;

	static name1Contains = text =>
		item => item.itemName1.includes(text);

	static name2Contains = text =>
		item => item.itemName2.includes(text);

	static textContains = text =>
		item => item.text.includes(text);

	// combo filters

	static all = ({itemClass, itemRarity, name1Contains, name2Contains, textContains}) =>
		Filter.and(...[
			itemClass && Filter.itemClass(itemClass),
			itemRarity && Filter.itemRarity(itemRarity),
			name1Contains && Filter.name1Contains(name1Contains),
			name2Contains && Filter.name2Contains(name2Contains),
			textContains && Filter.textContains(textContains),
		].filter(f => f));

	static nonUnique = () =>
		Filter.not(Filter.itemRarity('Unique'));
}

module.exports = Filter;

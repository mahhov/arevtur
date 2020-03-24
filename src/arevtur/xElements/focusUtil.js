let redirectFocus = (from, to) => {
	from.addEventListener('focus', () => {
		to.focus();
		from.tabIndex = -1;
	});
	from.addEventListener('blur', () => from.tabIndex = 0);
	from.tabIndex = 0;
};

module.exports = {redirectFocus};

var values = [];

var bodies = document.querySelectorAll('tbody:not(.item)');

bodies.forEach(body => {
	let attackEl = body.querySelector('[data-name=aps]');
	let critEl = body.querySelector('[data-name=crit]');

	let attack = parseFloat(attackEl.textContent);
	let crit = parseFloat(critEl.textContent);
	let value = (crit + 2) * attack;
	values.push(value);
});

var maxValue = Math.max(...values);

bodies.forEach((body, i) => {
	let span = body.querySelector('.appended-value');
	if (!span) {
		span = document.createElement('span');
		span.classList.toggle('appended-value');
	}
	span.textContent = `value = [${values[i]}] [${parseInt(values[i] / maxValue * 100)}%]`;
	body.appendChild(span);
});

console.log(`${maxValue} of ${values.length} values:`, values.sort((a, b) => b - a));

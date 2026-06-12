const {describe, it} = require('node:test');
const assert = require('node:assert');
const {transformGloveText, mappings} = require('../src/services/pobApi/stonefistMapping');

describe('stonefistMapping', () => {
	describe('stripMarkup via transformGloveText', () => {
		it('strips [Tag|Display] markup', () => {
			let input = 'Item Class\nTest Base\n+50 to maximum [EnergyShield|Energy Shield]';
			let result = transformGloveText(input);
			assert.ok(!result.includes('[EnergyShield|Energy Shield]'));
		});

		it('strips [Tag] markup', () => {
			let input = 'Item Class\nTest Base\nAdds 12 to 20 [Fire] damage to [Attack|Attacks]';
			let result = transformGloveText(input);
			assert.ok(!result.includes('[Fire]'));
			assert.ok(!result.includes('[Attack|Attacks]'));
		});
	});

	describe('tier lookup - Energy Shield', () => {
		it('+59 ES → Has +4 Evasion per level', () => {
			let result = transformGloveText('+59 to maximum Energy Shield');
			assert.ok(result.includes('Has +4 to Evasion Rating per player level'));
			assert.ok(result.includes('Has +1 to maximum Energy Shield per player level'));
		});

		it('+10 ES → Has +1 Evasion per level', () => {
			let result = transformGloveText('+10 to maximum Energy Shield');
			assert.ok(result.includes('Has +1 to Evasion Rating per player level'));
		});

		it('+25 ES → Has +2 Evasion per level', () => {
			let result = transformGloveText('+25 to maximum Energy Shield');
			assert.ok(result.includes('Has +2 to Evasion Rating per player level'));
		});
	});

	describe('tier lookup with interpolation - Critical Damage Bonus', () => {
		it('25% → +2.1% Critical Hit Chance (low end of tier)', () => {
			let result = transformGloveText('25% increased Critical Damage Bonus');
			assert.ok(result.includes('+2.1% to Critical Hit Chance'));
		});

		it('29% → +2.5% Critical Hit Chance (high end of tier)', () => {
			let result = transformGloveText('29% increased Critical Damage Bonus');
			assert.ok(result.includes('+2.5% to Critical Hit Chance'));
		});

		it('27% → interpolated value', () => {
			let result = transformGloveText('27% increased Critical Damage Bonus');
			assert.ok(result.includes('+2.3% to Critical Hit Chance'));
		});
	});

	describe('tier lookup - Dexterity (Surpassing)', () => {
		it('+27 Dex → +40% Surpassing (max of tier 25-27)', () => {
			let result = transformGloveText('+27 to Dexterity');
			assert.ok(result.includes('+40% Surpassing chance to fire an additional Projectile'));
		});

		it('+25 Dex → +36% Surpassing (low end of tier)', () => {
			let result = transformGloveText('+25 to Dexterity');
			assert.ok(result.includes('+36% Surpassing chance to fire an additional Projectile'));
		});
	});

	describe('tier lookup - Fire Resistance', () => {
		it('+31% → +2% Max Fire Res + 31% Fire Res', () => {
			let result = transformGloveText('+31% to Fire Resistance');
			assert.ok(result.includes('+2% to Maximum Fire Resistance'));
			assert.ok(result.includes('+31% to Fire Resistance'));
		});

		it('+35% → +2% Max Fire Res + 35% Fire Res', () => {
			let result = transformGloveText('+35% to Fire Resistance');
			assert.ok(result.includes('+2% to Maximum Fire Resistance'));
			assert.ok(result.includes('+35% to Fire Resistance'));
		});
	});

	describe('tierCapture:2 - Adds X to Y damage', () => {
		it('Adds 12 to 20 Fire → Gain 14% (tier by 2nd value)', () => {
			let result = transformGloveText('Adds 12 to 20 Fire damage to Attacks');
			assert.ok(result.includes('Attacks Gain 14% of Damage as Extra Fire Damage'));
		});

		it('Adds 1 to 55 Lightning → Gain 19-20% (tier 48-59)', () => {
			let result = transformGloveText('Adds 1 to 55 Lightning damage to Attacks');
			assert.ok(result.includes('Attacks Gain') && result.includes('% of Damage as Extra Lightning Damage'));
			let match = result.match(/Attacks Gain (\d+)%/);
			let value = parseInt(match[1]);
			assert.ok(value >= 19 && value <= 20, `Expected 19-20, got ${value}`);
		});

		it('Adds 1 to 4 Lightning → Gain 10% (lowest tier)', () => {
			let result = transformGloveText('Adds 1 to 4 Lightning damage to Attacks');
			assert.ok(result.includes('Attacks Gain 10% of Damage as Extra Lightning Damage'));
		});
	});

	describe('Attack Speed interpolation', () => {
		it('9% increased Attack Speed → 16% Onslaught (mid-tier)', () => {
			let result = transformGloveText('9% increased Attack Speed');
			assert.ok(result.includes('16% chance to gain Onslaught for 4 seconds on Hit'));
		});

		it('8% increased Attack Speed → 14% Onslaught (low end)', () => {
			let result = transformGloveText('8% increased Attack Speed');
			assert.ok(result.includes('14% chance to gain Onslaught for 4 seconds on Hit'));
		});
	});

	describe('constant orig with ranged conv - midpoint', () => {
		it('+2 Level Melee Skills → +1 Level + 11% Quality (midpoint of 10-12)', () => {
			let result = transformGloveText('+2 to Level of all Melee Skills');
			assert.ok(result.includes('+1 to Level of all Melee Skills'));
			assert.ok(result.includes('+11% to Quality of all Skills'));
		});
	});

	describe('unmatched lines pass through', () => {
		it('preserves lines that dont match any pattern', () => {
			let result = transformGloveText('Some Unknown Mod');
			assert.strictEqual(result, 'Some Unknown Mod');
		});

		it('preserves Item Class and base name', () => {
			let input = 'Item Class\nMoulded Mitts\n+59 to maximum Energy Shield';
			let result = transformGloveText(input);
			assert.ok(result.startsWith('Item Class\nMoulded Mitts\n'));
		});
	});

	describe('markup stripping with real item format', () => {
		it('handles full item text with markup', () => {
			let input = [
				'Item Class',
				'Moulded Mitts',
				'Sockets: S S',
				'+59 to maximum [EnergyShield|Energy Shield]',
				'25% increased [CriticalDamageBonus|Critical Damage Bonus]',
				'+27 to [Dexterity|Dexterity]',
			].join('\n');
			let result = transformGloveText(input);
			assert.ok(result.includes('Has +4 to Evasion Rating per player level'));
			assert.ok(result.includes('+2.1% to Critical Hit Chance'));
			assert.ok(result.includes('+40% Surpassing chance to fire an additional Projectile'));
		});
	});

	describe('mappings structure', () => {
		it('has mappings array', () => {
			assert.ok(Array.isArray(mappings));
			assert.ok(mappings.length > 100);
		});

		it('each mapping has pattern and tiers', () => {
			for (let m of mappings) {
				assert.ok(m.pattern instanceof RegExp, 'pattern should be RegExp');
				assert.ok(Array.isArray(m.tiers), 'tiers should be array');
				assert.ok(m.tiers.length > 0, 'tiers should not be empty');
			}
		});

		it('each tier has orig array with [min, max]', () => {
			for (let m of mappings) {
				for (let t of m.tiers) {
					assert.ok(Array.isArray(t.orig), 'orig should be array');
					assert.strictEqual(t.orig.length, 2);
					assert.ok(t.orig[0] <= t.orig[1], `orig min ${t.orig[0]} should be <= max ${t.orig[1]}`);
				}
			}
		});
	});
});

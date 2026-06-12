const {describe, it} = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));

describe('custom-update-source feature', () => {
	describe('package.json build.publish config', () => {
		it('has a build.publish field', () => {
			assert.ok(packageJson.build, 'build field missing');
			assert.ok(packageJson.build.publish, 'build.publish field missing');
		});

		it('publish provider is "github"', () => {
			assert.strictEqual(packageJson.build.publish.provider, 'github');
		});

		it('publish owner is not the original repo owner', () => {
			assert.notStrictEqual(packageJson.build.publish.owner, 'mahhov',
				'owner should be changed from original repo owner to your fork');
		});

		it('publish repo is set', () => {
			assert.ok(packageJson.build.publish.repo, 'repo field missing');
			assert.strictEqual(typeof packageJson.build.publish.repo, 'string');
		});

		it('publish config has required fields for electron-updater', () => {
			const {provider, owner, repo} = packageJson.build.publish;
			assert.ok(provider, 'provider is required');
			assert.ok(owner, 'owner is required');
			assert.ok(repo, 'repo is required');
		});
	});

	describe('repository field', () => {
		it('has a repository field', () => {
			assert.ok(packageJson.repository);
		});

		it('repository url is a valid git URL', () => {
			assert.ok(packageJson.repository.url.startsWith('git+https://') ||
				packageJson.repository.url.startsWith('git://'),
				'repository url should be a git URL');
		});
	});
});

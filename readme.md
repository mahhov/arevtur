# Arevtur (Private)

## Release Workflow

### Quick release (private build only)

```bash
npm version patch
```

This single command:
1. Bumps version in `package.json` and `package-lock.json`
2. Commits the version bump
3. Creates a git tag (e.g. `v9.4.1`)
4. Pushes commit + tag to `arevtur-private`
5. Builds the Windows exe
6. Publishes the exe as a GitHub release on `arevtur-private`

After publishing, edit the release description on GitHub to add changelog notes.

### Version bump options

| Command | Example | When to use |
|---------|---------|-------------|
| `npm version patch` | 9.4.0 → 9.4.1 | Bug fixes, small tweaks |
| `npm version minor` | 9.4.0 → 9.5.0 | New features |
| `npm version major` | 9.4.0 → 10.0.0 | Breaking changes |

### Full release (private + public)

1. **Release private build:**
   ```bash
   npm version patch
   ```

2. **Release public build (one command):**
   ```bash
   npm run release-public
   ```
   This syncs to `../arevtur-public`, sanitizes package.json, builds the exe, publishes it, commits, and pushes.

3. Edit release descriptions on both GitHub repos.

### Development

```bash
npm run start          # default (loads debug features if src/debug/ exists)
npm run start_local    # explicitly load debug features
npm run start_release  # force debug features off (test public version locally)
npm run test           # run tests
npm run build2         # build exe without publishing
```

### Syncing to public repo

```bash
npm run sync-public
```

This mirrors the codebase to `../arevtur-public`, excluding `src/debug/`, `.kiro/`, `dist/`, and `node_modules`. It also sanitizes `package.json` to remove the private token and private-only scripts.

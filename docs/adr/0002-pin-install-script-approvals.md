# Install-script approvals are pinned to the reviewed version

Dependency install scripts run arbitrary code on `npm install`, which is a common supply-chain attack vector. npm 11 (bundled with the Node 26 this project targets) lets `package.json` list which dependencies may run them in `allowScripts`. We keep each approval pinned to the exact version we reviewed (`"workerd@1.20261118.1": true`, `"esbuild@0.28.2": true`). This is npm's default (`allow-scripts-pin=true`), so a new and possibly compromised release does not inherit an approval nobody gave it. Denials, such as `"fsevents": false`, are name-only and cover every version.

## Considered Options

- **Name-only approvals** (`--no-allow-scripts-pin`, `"workerd": true`): never needs upkeep, but approves every future version unseen, which defeats the purpose.
- **`--dangerously-allow-all-scripts`**: turns the policy off entirely.

## Consequences

- Any dependency update that bumps `workerd` or `esbuild` (directly or through `wrangler` or `vitest`) leaves the pin stale, and that package counts as unreviewed again. npm's docs disagree on what happens next: either the script runs with a notice, or it is skipped. If it is skipped, the symptom shows up late, as a missing binary in `npm test` or `wrangler dev`, with nothing pointing back at `allowScripts`.
- After every dependency update, run:
  1. `npm install-scripts ls` to list unreviewed install scripts.
  2. Review each one, then `npm approve-scripts <pkg>` to re-pin it to the installed version.
  3. `npm install-scripts prune` to drop entries for versions no longer installed.

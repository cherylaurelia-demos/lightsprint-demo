# Lightsprint plugin: `/lightsprint:ask` on a fresh install

Unofficial demo by Cheryl Aurelia, not affiliated with Lightsprint. Live page: see the repo description.

## The problem (reproduced 2026-11-19 UTC, macOS arm64, Claude Code 2.1.327)
- The README installer (`install.sh`; `npx lightsprint` pipes the same script) downloads the CLI from the latest GitHub release, **v0.6.4 (2026-06-23)**, into `~/.claude/plugins/cache/lightsprint/lightsprint/0.6.4/bin` and `~/.local/bin`.
- `claude plugin install` installs skills and hooks from **main** (plugin.json `0.7.0`) into `.../0.7.0/`.
- main's `skills/ask/SKILL.md` runs `lightsprint session …` (added as `ask` in #91 on 2026-08-20, renamed in #125). v0.6.4 prints `Unknown command: session`. → [evidence/repro.log](evidence/repro.log), [evidence/claude-ask-0.7.0.json](evidence/claude-ask-0.7.0.json)
- `lightsprint upgrade` prints `Already up to date (v0.6.4)` and its `ensureInstalledPluginsJson` repoints `installed_plugins.json` at `.../0.6.4`, which holds only `bin/`. `claude plugin list` still says enabled; `claude plugin validate` finds no manifest, and `/lightsprint:ask` no longer exists in a session. → [evidence/repro.log](evidence/repro.log), [evidence/claude-ask-0.6.4.json](evidence/claude-ask-0.6.4.json)

## The patch
[`public/lightsprint-upgrade-guard.patch`](public/lightsprint-upgrade-guard.patch) against SprintsAI/lightsprint-claude-code-plugin@f9eea01:
- `scripts/ls-cli.js`: `ensureInstalledPluginsJson` returns early unless the target dir has `.claude-plugin/plugin.json` (exported for the test).
- `scripts/__tests__/upgrade-installed-plugins.test.js`: the layout install.sh leaves; fails without the guard, passes with it. Full suite: 298 pass (bun 1.4.4).
- `scripts/check-skills-vs-release.js`: exits 1 when a skill calls a command a given binary's `describe` lacks (v0.6.4: 9 misses, main: 0). → [evidence/check.log](evidence/check.log)
- After: same install with the patched CLI built as v0.6.4 keeps Claude Code on `0.7.0` with 18 skills. → [evidence/after.log](evidence/after.log)

Tagging v0.7.0 is what actually ships `session`; that's left to Lightsprint.

## Re-run
`bash evidence/repro.sh "$(mktemp -d)"` (needs `claude` on PATH; uses a throwaway HOME and no Lightsprint account).

## Page
`npm install && npm run build && npm run start` (Next.js).

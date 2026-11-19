#!/usr/bin/env bash
# Fresh-HOME repro of the Lightsprint Claude Code plugin install (README "Curl fallback" path).
set -u
SANDBOX="${1:?usage: repro.sh <empty dir>}"
mkdir -p "$SANDBOX/home"; export HOME="$SANDBOX/home" CLAUDE_CONFIG_DIR="$SANDBOX/home/.claude"
cd "$SANDBOX"
step(){ printf '\n$ %s\n' "$*"; "$@" 2>&1; }
echo "# $(date -u +%FT%TZ)  claude $(claude --version)"
printf '\n$ bash install.sh  (README curl fallback, non-interactive)\n'
bash -c "$(curl -fsSL https://raw.githubusercontent.com/SprintsAI/lightsprint-claude-code-plugin/main/install.sh)" <<< $'Y\nY' 2>&1 | grep -vE '^\s*$'
P="$HOME/.claude/plugins/cache/lightsprint/lightsprint"
printf '\n$ ls %s/*\n' '~/.claude/plugins/cache/lightsprint/lightsprint'; for d in "$P"/*; do echo "$(basename "$d"): $(ls "$d" | tr '\n' ' ')"; done
step "$HOME/.local/bin/lightsprint" version
step grep -m1 'lightsprint session' "$P/0.7.0/skills/ask/SKILL.md"
step "$HOME/.local/bin/lightsprint" session list
step "$HOME/.local/bin/lightsprint" upgrade
printf '\n$ jq installPath installed_plugins.json\n'; python3 -c "import json,os;print(json.load(open(os.path.expanduser('~/.claude/plugins/installed_plugins.json')))['plugins']['lightsprint@lightsprint'][0]['installPath'])"
step claude plugin list
step claude plugin validate "$P/0.6.4"

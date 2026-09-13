#!/usr/bin/env bash
# Session bootstrap. Run this first, every session, before writing any code.
#
# Bootstrap contract — initialisation is complete when all four hold:
#   1. can start          (deps installed)
#   2. can verify         (the cheapest gates run clean)
#   3. can see progress   (open features are printed)
#   4. can pick up next   (the progress log is printed)
#
# Fast gates only. Builds and end-to-end suites are per-task gates, not
# bootstrap gates: see docs/harness/verification/README.md for the full order.
# A bootstrap that takes minutes gets skipped, and a skipped bootstrap is no
# bootstrap.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== 1/4 dependencies ==="
{{INSTALL}}

echo
echo "=== 2/4 fast gates ==="
{{INIT_GATE_LINES}}

echo
echo "=== 3/4 open features (docs/harness/scope/features.json) ==="
node -e '
const { features } = require("./docs/harness/scope/features.json");
const open = features.filter(f => f.state !== "passing");
if (!open.length) { console.log("  none — every feature is passing."); process.exit(0); }
for (const f of open) console.log("  " + f.state.padEnd(12) + f.id + "  " + f.behavior);
'

echo
echo "=== 4/4 last session (docs/harness/state/progress.md) ==="
sed -n '/^## /,$p' docs/harness/state/progress.md | sed -n '1,30p' | sed 's/^/  /'

echo
echo "=== recent commits ==="
git log --oneline -10 2>/dev/null | sed 's/^/  /' || echo "  (no commits yet)"

echo
echo "=== environment healthy — now pick exactly ONE open feature (WIP=1) ==="

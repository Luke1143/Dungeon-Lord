#!/usr/bin/env bash
# Runs the browser tests in a row; exits non-zero when one fails. Screenshots only with "shots" as argument.
# Needs Node and Playwright with Chromium (in the cloud sessions both are installed globally).
cd "$(dirname "$0")"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
status=0
for t in smoke work emoji; do node "$t.js" || status=1; done
if [ "$1" = "shots" ]; then node shots.js "${@:2}" || status=1; fi
exit $status

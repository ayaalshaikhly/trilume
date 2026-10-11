#!/usr/bin/env bash
# Deploy TRILUME to Vercel (project "trilume", team crolog) from a git-free copy.
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"
trap 'cd /; rm -rf "$TMP" 2>/dev/null || true' EXIT
(cd "$SRC" && tar --exclude=./.git --exclude=./node_modules -cf - .) | (cd "$TMP" && tar -xf -)
(cd "$TMP" && vercel --prod --yes --scope crolog)
sleep 8; curl -s https://trilume.vercel.app/api/setup-db; echo
# Refresh www.ayaalshaikhly.com/TRILUME (served through the crolog project).
(cd /c/Users/huger/crolog && vercel cache purge --yes --scope crolog >/dev/null 2>&1) || true

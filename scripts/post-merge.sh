#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push

if [ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  REMOTE_URL="https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/yansihaloho/data.git"
  if git remote | grep -q '^origin$'; then
    git remote set-url origin "$REMOTE_URL"
  else
    git remote add origin "$REMOTE_URL"
  fi
  git push origin main
else
  echo "GITHUB_PERSONAL_ACCESS_TOKEN not set, skipping GitHub push"
fi

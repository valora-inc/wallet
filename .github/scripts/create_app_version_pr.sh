#!/usr/bin/env bash
set -euo pipefail

cd packages/mobile

# ensure that we are using ssh
git remote set-url origin git@github.com:valora-inc/wallet.git

app_version="$(node -p "require('./package.json').version")"

echo "Create branch"
git checkout -b $BRANCH_NAME

echo "Bump app version"
yarn pre-deploy --minor

echo "Push changes to branch"
git add .
git commit -m "Bump app version to $app_version"
git push --set-upstream origin $BRANCH_NAME

echo "Open app version bump PR"
curl -u "valora-bot:$VALORA_BOT_PAT" \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/valora-inc/wallet/pulls \
  -d '{ "head": "'$BRANCH_NAME'", "base": "main", "title": "[KATHY TEST] Automated app version bump", "draft": true }'

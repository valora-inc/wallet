#!/usr/bin/env bash
set -euo pipefail

cd packages/mobile

# ensure that we are using ssh
git remote set-url origin git@github.com:valora-inc/wallet.git

# TODO populate at the workflow level
branch_name="bump-app-version"
app_version="$(node -p "require('./package.json').version")"
echo "BRANCH_NAME="$branch_name"" >> $GITHUB_ENV

echo "Create branch"
git checkout -b $branch_name

echo "Bump app version"
yarn pre-deploy --minor

echo "Push changes to branch"
git add .
git commit -m "Bump app version to $app_version"
git push --set-upstream origin $branch_name

echo "Open app version bump PR"
curl -u "valora-bot:$VALORA_BOT_PAT" \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/valora-inc/wallet/pulls \
  -d '{ "head": "'"$branch_name"'", "base": "main", title: "[KATHY TEST] Automated app version bump", "draft": true }'
#!/usr/bin/env bash
set -euo pipefail

cd packages/mobile

# ensure that we are using ssh
git remote set-url origin git@github.com:valora-inc/wallet.git

echo "Create version bump branch from main"
git checkout -b $BRANCH_NAME

echo "Generate licences and disclaimer"
yarn deploy:update-disclaimer

echo "Push changes to branch"
git add .
git commit -m "Update licenses and disclaimer"
git push --set-upstream origin $BRANCH_NAME

echo "Open licences and disclaimer PR"
curl -u "valora-bot:$VALORA_BOT_TOKEN" \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/valora-inc/wallet/pulls \
  -d '{ "head": "'$BRANCH_NAME'", "base": "main", "title": "Update licences and disclaimer" }'

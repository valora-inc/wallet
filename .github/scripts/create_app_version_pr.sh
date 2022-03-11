#!/usr/bin/env bash
set -euo pipefail

cd packages/mobile

# ensure that we are using ssh
git remote set-url origin git@github.com:valora-inc/wallet.git

echo "Create version bump branch from main"
git checkout -b $BRANCH_NAME

echo "Bump app version"
yarn pre-deploy --minor --no-disclaimer

# TODO: remove this step as part of https://github.com/valora-inc/wallet/issues/1856
echo "Generate licences and disclaimer"
yarn licenses generate-disclaimer --prod > src/account/LicenseDisclaimer.txt && ./scripts/copy_license_to_android_assets.sh

app_version="$(node -p "require('./package.json').version")"

echo "Push changes to branch"
git add .
git commit -m "Bump app version to $app_version"
git push --set-upstream origin $BRANCH_NAME

echo "Open version bump PR"
curl -u "valora-bot:$VALORA_BOT_TOKEN" \
  -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/valora-inc/wallet/pulls \
  -d '{ "head": "'$BRANCH_NAME'", "base": "main", "title": "Bump app version to '$app_version'" }'

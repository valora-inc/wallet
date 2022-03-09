#!/usr/bin/env bash
set -euo pipefail

cd packages/mobile

# ensure that we are using ssh
git remote set-url origin git@github.com:valora-inc/wallet.git

branch_name="bump-app-version"
app_version="$(node -p "require('./package.json').version")"

echo "Create branch"
git checkout -b $branch_name
echo "BRANCH_NAME="$branch_name"" >> $GITHUB_ENV

echo "Bump app version"
yarn pre-deploy --minor

echo "Push changes to branch"
git add .
git commit -m "Bump app version to $app_version"
git push --set-upstream origin $branch_name

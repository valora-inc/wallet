#!/usr/bin/env bash
set -euo pipefail

cd packages/mobile

branch_name="bump-app-version"
app_version="$(node -p "require('./package.json').version")"

echo "Create branch"
git checkout -b $branch_name
echo "BRANCH_NAME="$branch_name"" >> $GITHUB_ENV

echo "Bump app version"
yarn
yarn pre-deploy --minor

echo "Push changes to branch"
git add .
git commit -m "Bump app version to $app_version"
git push origin

#!/usr/bin/env bash
set -euo pipefail

echo "This will prepare the mobile app for deployment to the store"

# Prompt for new version number
echo "===Updating app version==="
yarn version --no-git-tag-version
new_version="$(node -p "require('./package.json').version")"

echo "===Updating android/ios build files==="
# Android: use react-native-version, however on iOS it doesn't follow Xcode 11+ way of doing it, see iOS section below
yarn react-native-version --target android --never-amend
# Now increment Android versionCode
gradle_properties="android/gradle.properties"
current_version_code="$(grep "VERSION_CODE" $gradle_properties | cut -d '=' -f 2)"
new_version_code=$((current_version_code + 1))
sed -i "" "s/^VERSION_CODE=.*/VERSION_CODE=$new_version_code/" $gradle_properties

# iOS: use sed to change MARKETING_VERSION in the project (agvtool unfortunately changes the plist files which we don't want)
sed -i '' -e "s/MARKETING_VERSION \= [^\;]*\;/MARKETING_VERSION = $new_version;/" ios/celo.xcodeproj/project.pbxproj
# agvtool works correctly for CURRENT_PROJECT_VERSION though and only touches the project and not the plist files
pushd ios; agvtool next-version; popd
echo "===Done updating versions==="

echo "===Update license list and disclaimer==="
yarn deploy:update-disclaimer
echo "===Done updating licenses==="

echo "Pre-deploy steps complete"

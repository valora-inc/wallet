set -e

echo Running pre-build checks...
yarn ts-node .github/scripts/preBuildChecks.ts

if [[ "$EAS_BUILD_PLATFORM" == "android" ]]; then
  echo Updating Android version code...
  if [[ -n "$APP_VERSION_CODE" ]]; then
    sed -i "s/^VERSION_CODE=.*/VERSION_CODE=${APP_VERSION_CODE}/" android/gradle.properties
    echo VERSION_CODE updated to "$APP_VERSION_CODE" in android/gradle.properties
  else
    echo APP_VERSION_CODE is not set or empty. Doing nothing.
  fi
fi

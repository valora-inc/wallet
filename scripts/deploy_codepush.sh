#!/bin/bash

help () {
  echo "Usage: $0 -v Version -k Codepush Key -e Environment"
  echo "\t-v Version: Version number to deploy"
  echo "\t-k Codepush Key: Codepush key to use"
  echo "\t-e Environment: Environment to deploy to"
  echo "\nUseful scripts:"
  echo "Usage: Get the deployment key before deploying to codepush."
  echo "\tappcenter codepush deployments list --displayKeys --app <appname>"
  exit 1
}

while getopts "v:k:e:" opt
do
  case "$opt" in
    v) VERSION="$OPTARG" ;;
    k) KEY="$OPTARG" ;;
    e) ENV="$OPTARG" ;;
    *) help;;
  esac
done

if [ -z "$VERSION" ] || [ -z "$KEY" ] || [ -z "$ENV" ]
then
  help
fi

IOS_DEPLOYMENT_TARGET="Zed-Labs/kolektivo"
ANDROID_DEPLOYMENT_TARGET="Zed-Labs/kolektivo-android"

codePush () {
  DEPLOYMENT = $1
  TARGET_VERSION = $2
  ENVIRONMENT = $3
  appcenter codepush release-react -a $DEPLOYMENT -t $TARGET_VERSION -d $ENVIRONMENT
}

echo $VERSION $KEY $ENV
echo "This will push a new version of the bundled js to $VERSION of the app on $ENV"

read -p "Press any key to continue... " -n1 -s
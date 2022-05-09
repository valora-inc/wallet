#!/usr/bin/env sh
#
# Xcode scheme pre action script 

set -exu

# First copy the envfile
cp "${SRCROOT}/../$1" /tmp/.env-xcode
# Add newline in case it's missing, otherwise it causes an issue
echo "" >> /tmp/.env-xcode

# Then we load the env variables
# From https://stackoverflow.com/a/56229034/158525
# Supports vars with spaces and single or double quotes
eval "$(grep -v -e '^#' /tmp/.env-xcode | xargs -I {} echo export \'{}\')"

# Now augment it with network specific "secrets" (not real secrets, just API keys)
# See https://newbedev.com/how-to-convert-a-json-object-to-key-value-format-in-jq
jq -r ".${DEFAULT_TESTNET}|to_entries|map(\"\(.key)=\(.value|tostring)\")|.[]" "${SRCROOT}/../secrets.json" >> /tmp/.env-xcode

# This makes the scheme use the specified envfile
# See https://github.com/luggit/react-native-config#ios-1
echo "/tmp/.env-xcode" > /tmp/envfile

# This makes envfile config available in xcode build settings
# See https://github.com/luggit/react-native-config#availability-in-build-settings-and-infoplist
"${SRCROOT}/../node_modules/react-native-config/ios/ReactNativeConfig/BuildXCConfig.rb" "${SRCROOT}/.." "${SRCROOT}/env.xcconfig"

#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Sync the English infoPlist.strings from the actual Info.plist to be used by Crowdin
# ========================================

scriptDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$scriptDir/.."

plist_keys=(
  NSCameraUsageDescription
  NSContactsUsageDescription
  NSPhotoLibraryAddUsageDescription
  NSPhotoLibraryUsageDescription
  NSUserTrackingUsageDescription
  NSFaceIDUsageDescription
)

info_plist_strings="ios/celo/Base.lproj/InfoPlist.strings"
echo -e "/* DO NOT EDIT MANUALLY, SEE scripts/sync_ios_info_plist_strings.sh */\n" > $info_plist_strings

for plist_key in "${plist_keys[@]}"; do
  plist_value=$(/usr/libexec/PlistBuddy -c "Print :$plist_key" ios/celo/Info.plist)
  echo "$plist_key = \"$plist_value\";" >> $info_plist_strings
done

# Check the strings file is valid
/usr/bin/plutil -lint $info_plist_strings

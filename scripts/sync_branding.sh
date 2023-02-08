#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Setup branding used in the project
# ========================================

# Flags:
# -b (Optional): Name of the branding to use: celo or valora (default)

branding=kolektivo
while getopts 'b:' flag; do
  case "${flag}" in
    b) branding="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

mobile_root="$(dirname "$(dirname "$0")")"
echo $mobile_root
cd "$mobile_root"

if [[ "$branding" == "kolektivo" ]]; then
  # prevents git from asking credentials
  export GIT_TERMINAL_PROMPT=0
  if [[ ! -e branding/celo ]] && ! git clone git@github.com:zed-io/kolektivo-branding.git branding/celo ; then
    echo "Couldn't clone private branding. Will use default branding."
    branding=celo
  else
    branding=celo
    pushd "branding/$branding"
    git pull
    popd
  fi
fi

echo "Using branding/$branding"
echo "Copying all folders from branding/$branding to $mobile_root"
rsync -avyz --exclude '.git' --exclude '.gitignore' "$mobile_root/branding/$branding/" "$mobile_root"

# Now clean up branded files which have been deleted
# This is needed when switching branding, so we don't leave files
# from the previously synced branding

# Update this list if there are more branded patterns to clean up
patterns_to_delete=(
  "android/app/src/*.xml"
  "android/app/src/*.png"
  "android/app/src/*.jpg"
  "ios/celo/*.png"
  "ios/celo/*.jpg"
  "src/*.png"
  "src/*.jpg"
)

# This finds ignored files in the source tree which are not in the branded list of files
# Note: this isn't entirely fool proof, but is good enough for now ;)
# Command explanation: comm -23 <(sort set1) <(sort set2)
# outputs elements in set1 that are not in set2
# See https://unix.stackexchange.com/questions/11343/linux-tools-to-treat-files-as-sets-and-perform-set-operations-on-them?rq=1
to_delete=$(comm -23 \
  <(git ls-files --others ${patterns_to_delete[@]} | sort) \
  <(cd "branding/$branding"; git ls-files ${patterns_to_delete[@]} | sort)
)

for old_file in $to_delete; do
  echo "Deleting: $old_file"
  rm -f "$old_file"
done

#!/usr/bin/env bash
set -euo pipefail

# ========================================
# Setup branding used in the project
# ========================================

mobile_root="$(dirname "$(dirname "$0")")"
echo $mobile_root
cd "$mobile_root"

echo "Copying files from branding to project"

rsync -avyz --exclude '.git' --exclude '.gitignore' "$mobile_root/branding/" "$mobile_root"

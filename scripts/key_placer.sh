#!/usr/bin/env bash

echo "Processing encrypted files"

# Set list of secret files to encrypt and decrypt.
files=(
  "android/app/src/alfajores/google-services.json:celo-mobile-alfajores"
  "android/app/src/alfajoresdev/google-services.json:celo-mobile-alfajores"
  "android/app/src/alfajoresnightly/google-services.json:celo-mobile-alfajores"
  "android/app/src/mainnet/google-services.json:celo-mobile-mainnet"
  "android/app/src/mainnetdev/google-services.json:celo-mobile-mainnet"
  "android/app/src/mainnetnightly/google-services.json:celo-mobile-mainnet"
  "android/sentry.properties:celo-mobile-alfajores"
  "ios/GoogleService-Info.alfajores.plist:celo-mobile-alfajores"
  "ios/GoogleService-Info.alfajoresdev.plist:celo-mobile-alfajores"
  "ios/GoogleService-Info.alfajoresnightly.plist:celo-mobile-alfajores"
  "ios/GoogleService-Info.mainnet.plist:celo-mobile-mainnet"
  "ios/GoogleService-Info.mainnetdev.plist:celo-mobile-mainnet"
  "ios/GoogleService-Info.mainnetnightly.plist:celo-mobile-mainnet"
  "ios/sentry.properties:celo-mobile-alfajores"
  "secrets.json:celo-mobile-alfajores"
  "e2e/.env:celo-mobile-alfajores"
)

if [[ -z "$1" ]]; then
  echo "Encrypt or decrypt secret files using GCP keystore."
  echo "usage: $0 < encrypt | decrypt >"
  exit 1
elif [[ $1 != "encrypt" ]] && [[ $1 != "decrypt" ]]; then
  echo "invalid action $1. Choose 'encrypt' or 'decrypt'"
  echo "usage: $0 < encrypt | decrypt >"
  exit 1
fi

# this is to allow the script to be called from anywhere
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR
cd ..

# place templates to be used (if they exist) in case the environment
# doesn't have access to decryption keys
if [[ $1 == "decrypt" ]]; then
  for file_path_map in "${files[@]}"; do
    file_path=${file_path_map%%:*}
    template_file_path="$file_path.template"

    if test -f "$template_file_path" && ! test -f "$file_path"; then
      cp "$template_file_path" "$file_path"
    fi
  done
fi

command -v gcloud > /dev/null 2>&1
if [[ $? -eq 1 ]]; then
  echo "gcloud is not installed - skipping ${1}ion"
  exit 0
fi

for file_path_map in "${files[@]}"; do
  file_path=${file_path_map%%:*}
  environment=${file_path_map#*:}
  encrypted_file_path="$file_path.enc"

  # When decrypting ensure the encrypted file exists or skip.
  if [[ $1 == "decrypt" ]] && ! test -f "$encrypted_file_path"; then
    echo "$encrypted_file_path does not exist, cannot decrypt - skipping file" >&2
    continue
  fi

  # When encrypting ensure the plaintext file exists.
  if [[ $1 == "encrypt" ]]; then
    if [[ ! -f "$file_path" ]]; then
        echo "$file_path does not exist, cannot encrypt - skipping file" >&2
        continue
    fi
  fi

  # Encrypt or decrypt this file.
  gcloud kms $1 --ciphertext-file=$encrypted_file_path --plaintext-file=$file_path --key=wallet --keyring=github --location=global --project $environment
  if [[ $? -eq 1 ]]; then
    echo "Only Valora employees with $environment access can $1 keys - skipping ${1}ion"
    exit 0
  fi
done

if [[ $1 == "decrypt" ]]; then
  echo "Encrypted files decrypted"
elif [[ $1 == "encrypt" ]]; then
  echo "Decrypted files encrypted"
fi

exit 0

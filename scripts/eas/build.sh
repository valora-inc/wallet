set -e

eas env:create production --non-interactive --force --name=APP_VERSION_CODE --value=$(git log -1 --format=%ct) --visibility=plaintext
eas build "$@"
eas env:delete production --non-interactive --variable-name=APP_VERSION_CODE
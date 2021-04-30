#!/usr/bin/env bash
set -euo pipefail

# Deploys a Cloud Function
#
# Flags:
# -e: Name of the environment (alfajores or mainnet).
# -f: Name of the Cloud Function to deploy.

ENVIRONMENT=""
FUNCTION=""

while getopts 'e:f:' flag; do
  case "${flag}" in
    e) ENVIRONMENT="$OPTARG" ;;
    f) FUNCTION="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$ENVIRONMENT" ] && echo "Need to set the ENVIRONMENT via the -e flag" && exit 1;
[ -z "$FUNCTION" ] && echo "Need to set the FUNCTION via the -f flag" && exit 1;

echo "Starting deployment of ${FUNCTION} on ${ENVIRONMENT}."

firebase use ${ENVIRONMENT}
./firebase-env-config.sh -e ${ENVIRONMENT}

firebase deploy --only functions:${FUNCTION}

echo "Done deployment."

#!/usr/bin/env bash
set -euo pipefail

ENV_NAME=""

while getopts 'e:' flag; do
  case "${flag}" in
    e) ENV_NAME="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

ENV_FILENAME=".env.${ENV_NAME}"

firebase functions:config:set \
transak.widget_url=$(grep TRANSAK_WIDGET_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
transak.public_key=$(grep TRANSAK_PUBLIC_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
transak.private_key=$(grep TRANSAK_PRIVATE_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
ramp.widget_url=$(grep RAMP_WIDGET_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
ramp.public_key=$(grep RAMP_PUBLIC_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
moonpay.widget_url=$(grep MOONPAY_WIDGET_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
moonpay.public_key=$(grep MOONPAY_PUBLIC_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
moonpay.private_key=$(grep MOONPAY_PRIVATE_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
simplex.api_url=$(grep SIMPLEX_API_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
simplex.api_key=$(grep SIMPLEX_API_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
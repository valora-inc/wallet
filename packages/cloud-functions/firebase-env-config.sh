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
transak.api_url=$(grep TRANSAK_API_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
transak.public_key=$(grep TRANSAK_PUBLIC_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
transak.private_key=$(grep TRANSAK_PRIVATE_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
ramp.widget_url=$(grep RAMP_WIDGET_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
ramp.api_url=$(grep RAMP_API_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
ramp.public_key=$(grep RAMP_PUBLIC_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
ramp.pem_file=$(grep RAMP_PEM_FILE "$ENV_FILENAME" | cut -d '=' -f 2-) \
ramp.webhook_url=$(grep RAMP_WEBHOOK_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
moonpay.widget_url=$(grep MOONPAY_WIDGET_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
moonpay.api_url=$(grep MOONPAY_API_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
moonpay.public_key=$(grep MOONPAY_PUBLIC_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
moonpay.private_key=$(grep MOONPAY_PRIVATE_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
moonpay.webhook_key=$(grep MOONPAY_WEBHOOK_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
simplex.api_url=$(grep SIMPLEX_API_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
simplex.checkout_url=$(grep SIMPLEX_CHECKOUT_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
simplex.event_url=$(grep SIMPLEX_EVENT_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
simplex.api_key=$(grep SIMPLEX_API_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
xanpool.widget_url=$(grep XANPOOL_WIDGET_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
xanpool.api_url=$(grep XANPOOL_API_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
xanpool.public_key=$(grep XANPOOL_PUBLIC_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
xanpool.private_key=$(grep XANPOOL_PRIVATE_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
blockchain_api.url=$(grep BLOCKCHAIN_API_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
ip_api.key=$(grep IP_API_KEY "$ENV_FILENAME" | cut -d '=' -f 2-) \
full_node.url=$(grep FULL_NODE_URL "$ENV_FILENAME" | cut -d '=' -f 2-) \
db.host=$(grep DB_HOST "$ENV_FILENAME" | cut -d '=' -f 2-) \
db.database=$(grep DB_DATABASE "$ENV_FILENAME" | cut -d '=' -f 2-) \
db.user=$(grep DB_USERNAME "$ENV_FILENAME" | cut -d '=' -f 2-) \
db.password=$(grep DB_PASSWORD "$ENV_FILENAME" | cut -d '=' -f 2-) \
ubeswap.factory_address=$(grep UBESWAP_FACTORY_ADDRESS "$ENV_FILENAME" | cut -d '=' -f 2-) \
ubeswap.min_liquidity=$(grep UBESWAP_MIN_LIQUIDITY "$ENV_FILENAME" | cut -d '=' -f 2-) \
ubeswap.max_concurrency=$(grep UBESWAP_MAX_CONCURRENCY "$ENV_FILENAME" | cut -d '=' -f 2-) \
token_addresses.cusd=$(grep TOKEN_ADDRESSES_CUSD "$ENV_FILENAME" | cut -d '=' -f 2-) \
token_addresses.ceur=$(grep TOKEN_ADDRESSES_CEUR "$ENV_FILENAME" | cut -d '=' -f 2-) \
token_addresses.mcusd=$(grep TOKEN_ADDRESSES_MCUSD "$ENV_FILENAME" | cut -d '=' -f 2-) \
token_addresses.mceur=$(grep TOKEN_ADDRESSES_MCEUR "$ENV_FILENAME" | cut -d '=' -f 2-) \
exchanges.env=$(grep EXCHANGE_RATE_ENV "$ENV_FILENAME" | cut -d '=' -f 2-) \


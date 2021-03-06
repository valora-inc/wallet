#!/usr/bin/env bash

firebase functions:config:set \
transak.url_staging=$(grep TRANSAK_URL_STAGING .env | cut -d '=' -f 2-) \
transak.url_prod=$(grep TRANSAK_URL_PROD .env | cut -d '=' -f 2-) \
transak.public_key_staging=$(grep TRANSAK_PUBLIC_KEY_STAGING .env | cut -d '=' -f 2-) \
transak.private_key_staging=$(grep TRANSAK_PRIVATE_KEY_STAGING .env | cut -d '=' -f 2-) \
transak.public_key_prod=$(grep TRANSAK_PUBLIC_KEY_PROD .env | cut -d '=' -f 2-) \
transak.private_key_prod=$(grep TRANSAK_PRIVATE_KEY_PROD .env | cut -d '=' -f 2-) \
ramp.url_staging=$(grep RAMP_URL_STAGING .env | cut -d '=' -f 2-) \
ramp.url_prod=$(grep RAMP_URL_PROD .env | cut -d '=' -f 2-) \
ramp.public_key_staging=$(grep RAMP_PUBLIC_KEY_STAGING .env | cut -d '=' -f 2-) \
ramp.public_key_prod=$(grep RAMP_PUBLIC_KEY_PROD .env | cut -d '=' -f 2-) \
moonpay.url_staging=$(grep MOONPAY_URL_STAGING .env | cut -d '=' -f 2-) \
moonpay.url_prod=$(grep MOONPAY_URL_PROD .env | cut -d '=' -f 2-) \
moonpay.public_key_staging=$(grep MOONPAY_PUBLIC_KEY_STAGING .env | cut -d '=' -f 2-) \
moonpay.private_key_staging=$(grep MOONPAY_PRIVATE_KEY_STAGING .env | cut -d '=' -f 2-) \
moonpay.public_key_prod=$(grep MOONPAY_PUBLIC_KEY_PROD .env | cut -d '=' -f 2-) \
moonpay.private_key_prod=$(grep MOONPAY_PRIVATE_KEY_PROD .env | cut -d '=' -f 2-) \
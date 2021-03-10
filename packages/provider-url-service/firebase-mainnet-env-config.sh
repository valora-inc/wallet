#!/usr/bin/env bash

firebase functions:config:set \
transak.public_key=$(grep TRANSAK_PUBLIC_KEY_PROD .env | cut -d '=' -f 2-) \
transak.private_key=$(grep TRANSAK_PRIVATE_KEY_PROD .env | cut -d '=' -f 2-) \
ramp.public_key=$(grep RAMP_PUBLIC_KEY_PROD .env | cut -d '=' -f 2-) \
moonpay.public_key=$(grep MOONPAY_PUBLIC_KEY_PROD .env | cut -d '=' -f 2-) \
moonpay.private_key=$(grep MOONPAY_PRIVATE_KEY_PROD .env | cut -d '=' -f 2-) \
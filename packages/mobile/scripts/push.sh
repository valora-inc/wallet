#!/usr/bin/env bash

#####
# Sends a push notification to a specific device
#
#####


# celo-mobile-alfajores
# https://console.firebase.google.com/project/celo-mobile-alfajores/settings/cloudmessaging/ios:org.celo.mobile.alfajores
FCM_SERVER_KEY="AAAA-JlYGI4:APA91bGHPykAPaW2otg2-NnnM66AliXZ3L1B9_DA6APThwm2VMdltPMNCZF-2VKyZ4qAZedodEiqIViojmuD9Ey10SQ2SygosV-h0FgRBVbrWQ54ZxY3P9mZWyeeyC3QtsD6VLZKdPRA"
USER_FCM_TOKEN="fF9MhtPL1wI:APA91bGhvwDXyabCbolpibIiH5hdEpd0IHi82kjjKhiASdYXCYTXBpm0I00uD2EHKCy_itcI5Oi9oYQnI13BFTBRE7YVf9YwEuIpsMTZoGthDQrBXl40ANyN1SNz5X-9sgLC3Yumcxdp"

curl -X POST --header "Authorization: key=$FCM_SERVER_KEY" \
        --Header "Content-Type: application/json" \
        https://fcm.googleapis.com/fcm/send \
        -d '{
      "notification": {
        "title": "Test Title",
        "body": "Tap this to be redirected to celo.org"
      },
      "android": {
        "ttl": 604800000,
        "priority": "normal",
        "notification": {
          "icon": "ic_stat_rings",
          "color": "#42D689"
        }
      },
      "data": {
        "ou": "https://celo.org"
      },
      "to": "'"$USER_FCM_TOKEN"'"
    } '

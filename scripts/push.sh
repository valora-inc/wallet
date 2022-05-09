#!/usr/bin/env bash

#####
# Sends a push notification to a specific device
#
#####


# celo-mobile-alfajores
# https://console.firebase.google.com/project/celo-mobile-alfajores/settings/cloudmessaging/ios:org.celo.mobile.alfajores
FCM_SERVER_KEY=""
# to get your token you can add a log in src/firebase/firebase.ts registerTokenToDb
USER_FCM_TOKEN=""

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

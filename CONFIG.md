# Config (Kolektivo)

- [Config (Kolektivo)](#config-kolektivo)
  - [Overview](#overview)
  - [Services](#services)
    - [Firebase](#firebase)
    - [Sentry](#sentry)
    - [Segment Analytics](#segment-analytics)
    - [Codepush](#codepush)
  - [Future Update](#future-update)

## Overview

This section contains the setup instructions for various credentials and secrets required when either running the wallet in dev mode, or deploying a production build to the Alfajores or Forno networks.

## Services

The wallet uses the following services:

- Firebase Realtime Database
- Firebase Authentication
- Firebase Analytics
- Firebase Admin
- Sentry
- Segment Analytics
- Codepush

N.B. The wallet only writes data to the `users` document in the RTDB.

### Firebase

The wallet requires a `GoogleService-Info.plist` file for iOS, and a `google-services.json` file for Android. Specifically, the format is `GoogleService-Info.{$env}.plist`, where `${env}` is the environment setting name, e.g. `alfajoresdev`. You can get the file from the firebase server, and place it in the `ios` folder.

N.B.
iOS expects a `GoogleService-Info.plist` in the `ios` folder
Android expects a `google-services.json` in the `android/app/src/${env}` folder

1. When archiving the wallet, specify the environment file to be used, and ensure that `FIREBASE_ENABLED=true`
2. Ensure that the `GoogleService-Info.${env}.plist` file is present in the `ios` folder.

### Sentry

The wallet is connected to a Sentry deployment for issue/error tracking.

The wallet requires a Sentry DSN. This can remain public as it does not give read access to any important information in the Sentry deployment

1. When archiving the wallet, specify the environment file to be used, and ensure that `SENTRY_ENABLED=true`
2. Ensure that the `secrets.json` file has the property `SENTRY_CLIENT_URL` set as the DSN. (See `secrets.json.template`)

### Segment Analytics

The wallet integrates Firebase analytics through Segment's aggregator. Analytics is disabled by default for development. See [ValoraAnalytics.isEnabled](src/analytics/ValoraAnalytics.ts)

The wallet requires the Segment API key. This should not remain public as it will allow users to write analytics data to the server.

1. Ensure that the `secrets.json` file has the property `SENTRY_CLIENT_URL` set as the DSN. (See `secrets.json.template`)

### Codepush

The wallet has OTA updates enabled for javascript bundle changes. This is executed by Codepush.

The wallet requires that you set the `CodePushDeploymentKey:<key>` pair in the `Info.plist` file.

1. When archiving the wallet, specify the environment file to be used, and ensure that the key provided in the key value pair matches the Codepush environment that is expected to be the deployment target.

e.g. When archiving `.env.alfajores`, use the staging Codepush key.

For Android you will have to place the Deployment key in `strings.xml`. To do generate the deployment key using this command `appcenter codepush deployment list -a Zed-Labs/kolektivo -k`. After that place that key in the CodePushDeploymentKey string in the `strings.xml` file.

## Future Update

The next goal is to commit encrypted versions of the above files to the repo, where a developer can simply authenticate with GCP and have the files decrypted.

1. `secrets.json` - Sentry, Segment
2. `GoogleInfo.${env}.plist` - Firebase
3. `Info.plist` - Codepush

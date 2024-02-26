# Mobile (Valora)

- [Mobile (Valora)](#mobile-valora)
  - [Overview](#overview)
  - [Architecture](#architecture)
  - [Setup](#setup)
    - [Prerequisites](#prerequisites)
    - [Repository secrets](#repository-secrets)
      - [For Valora employees only](#for-valora-employees-only)
      - [For External contributors](#for-external-contributors)
    - [iOS](#ios)
      - [Enroll in the Apple Developer Program](#enroll-in-the-apple-developer-program)
      - [Install Xcode](#install-xcode)
      - [Install Ruby, Cocoapods, Bundler, and download project dependencies](#install-ruby-cocoapods-bundler-and-download-project-dependencies)
      - [Install Rosetta (M1 macs only)](#install-rosetta-m1-macs-only)
    - [Android](#android)
      - [MacOS](#macos)
      - [Linux](#linux)
        - [Optional: Install an Android emulator](#optional-install-an-android-emulator)
        - [Configure an emulator using the Android SDK Manager](#configure-an-emulator-using-the-android-sdk-manager)
        - [Install Genymotion Emulator Manager](#install-genymotion-emulator-manager)
          - [MacOS](#macos-1)
          - [Linux](#linux-1)
  - [Running the mobile wallet](#running-the-mobile-wallet)
    - [iOS](#ios-1)
    - [Android](#android-1)
    - [Running on Mainnet](#running-on-mainnet)
    - [Reinstalling the app without building](#reinstalling-the-app-without-building)
  - [Debugging \& App Profiling](#debugging--app-profiling)
    - [Debugging](#debugging)
      - [Install Flipper](#install-flipper)
    - [App Profiling with react-devtools](#app-profiling-with-react-devtools)
    - [App Profiling with Android Profiler](#app-profiling-with-android-profiler)
  - [Testing](#testing)
    - [Snapshot testing](#snapshot-testing)
    - [React component unit testing](#react-component-unit-testing)
    - [Saga testing](#saga-testing)
    - [End-to-End testing](#end-to-end-testing)
  - [Building APKs / Bundles](#building-apks--bundles)
    - [Creating a fake keystore](#creating-a-fake-keystore)
    - [Building an APK or Bundle](#building-an-apk-or-bundle)
  - [Other](#other)
    - [Localization (l10n) / translation process](#localization-l10n--translation-process)
    - [Configuring the SMS Retriever](#configuring-the-sms-retriever)
    - [Redux state migration](#redux-state-migration)
      - [When is a migration or new schema version needed?](#when-is-a-migration-or-new-schema-version-needed)
      - [What do to when test/RootStateSchema.json needs an update?](#what-do-to-when-testrootstateschemajson-needs-an-update)
    - [Redux-Saga pitfalls](#redux-saga-pitfalls)
    - [Error bubbling](#error-bubbling)
    - [Why do we use http(s) provider?](#why-do-we-use-https-provider)
    - [Helpful hints for development](#helpful-hints-for-development)
    - [Vulnerabilities found in dependencies](#vulnerabilities-found-in-dependencies)
    - [Branding (for Valora employees only)](#branding-for-valora-employees-only)
    - [Troubleshooting](#troubleshooting)
      - [Postinstall script](#postinstall-script)
      - [`Activity class {org.celo.mobile.staging/org.celo.mobile.MainActivity} does not exist.`](#activity-class-orgcelomobilestagingorgcelomobilemainactivity-does-not-exist)
      - [Podfile changes not picked up by iOS build](#podfile-changes-not-picked-up-by-ios-build)

## Overview

This package contains the code for the Valora mobile apps for Android and iOS.
Valora is a self-sovereign wallet that enables anyone to onboard onto the Celo network, manage their currencies, and send payments.

## Architecture

The app uses [React Native][react native].

## Setup

### Prerequisites

Install [Homebrew](https://brew.sh) if you are on macOS.

Install [NVM](https://github.com/nvm-sh/nvm#install--update-script) if you don't have any Node version manager.

Install Node version listed in [.nvmrc](.nvmrc) and make it default (example for NVM):

```bash
nvm install --default
```

Install Yarn

```bash
npm install --global yarn
```

Install [watchman][watchman] and [jq][jq]

```bash
# On a mac
brew install watchman
brew install jq
```

### Repository secrets

#### For Valora employees only

_This is only for Valora employees._

You will need to be added the team keyring on GCP so you can decrypt secrets in the repo. (Ask for an invite to `celo-mobile-alfajores`.)

Once you have access, install Google Cloud by running `brew install google-cloud-sdk`.
Follow instructions [here](https://cloud.google.com/sdk/gcloud/reference/auth/login)
for logging in with Google credentials.

To test your GCP access, try running `yarn keys:decrypt` from the wallet repo root. You should see something like this: `Encrypted files decrypted`.
(You will not need to run this command on an ongoing basis, since it is done automatically as part of the `postinstall` script.)

#### For External contributors

External contributors don't need to decrypt repository secrets and can successfully build and run the mobile application with the following differences:

- the default branding will be used (some images/icons will appear in pink or will be missing)
- Firebase related features needs to be disabled. You can do this by setting `FIREBASE_ENABLED=false` in the `.env.*` files.

### iOS

#### Enroll in the Apple Developer Program

In order to successfully set up your iOS development environment you will need to enroll in the [Apple Developer Program]. It is recommended that you enroll from an iOS device by downloading the Apple Developer App in the App Store. Using the app will result in the fastest processing of your enrollment.

_If you are a Valora employee, please ask to be added to the Valora iOS development team._

#### Install Xcode

Xcode is needed to build and deploy the mobile wallet to your iOS device. If you do not have an iOS device, Xcode can be used to emulate one.

Install [Xcode 15.2](https://developer.apple.com/download/more/?q=xcode) (an Apple Developer Account is needed to access this link).

We do not recommend installing Xcode through the App Store as it can auto update and become incompatible with our projects.

Note that using the method above, you can have multiple versions of Xcode installed in parallel if you'd like. Simply use different names for the different version of Xcode in your computer's `Applications` folder (e.g., `Xcode14.3.1.app` and `Xcode15.2.app`).

#### Install Ruby, Cocoapods, Bundler, and download project dependencies

Install Ruby 2.7 and make it global

```bash
brew install rbenv ruby-build

# run and follow the printed instructions:
rbenv init

rbenv install 2.7.8
rbenv global 2.7.8
```

Make sure you are in the `ios` directory of the repository root before running the following:

```bash
# install cocopods and bundler if you don't already have it
gem install cocoapods
gem install bundler
# download the project dependencies in repository root
bundle install
# run inside /ios
bundle exec pod install
```

1. Run `yarn install` in the repository root.
2. Run `yarn dev:ios` in the repository root.

#### Install Rosetta (M1 macs only)

If you are unable to run the app in the iOS Simulator, install Rosetta:

```bash
/usr/sbin/softwareupdate --install-rosetta --agree-to-license
```

### Android

[Download and install Android Studio](https://developer.android.com/studio/index.html) and the following add-ons:

- Android SDK
- Android SDK Platform
- Android Virtual Device

Install the Android 13 (Tiramisu) SDK. It can be found can be installed through the SDK Manager in Android Studio.

Configure the `ANDROID_HOME` environment variables by adding the following lines to your `~/.zprofile` or `~/.zshrc`. You can find the actual location of the SDK in the Android Studio "Preferences" dialog, under Appearance & Behavior → System Settings → Android SDK.

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### MacOS

After installing Andoid Studio, add the [Android NDK][android ndk] (if you run into issues with the toolchain, try using version: 22.x).

Make sure these lines are in your shell profile (`~/.bash_profile`, `~/.zshrc` etc.):

_Note that these paths may differ on your machine. You can find the path to the SDK and NDK via the [Android Studio menu](https://stackoverflow.com/questions/40520324/how-to-find-the-path-to-ndk)._

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export ANDROID_NDK=$ANDROID_HOME/ndk-bundle
export ANDROID_SDK_ROOT=$ANDROID_HOME
# this is an optional gradle configuration that should make builds faster
export GRADLE_OPTS='-Dorg.gradle.daemon=true -Dorg.gradle.parallel=true -Dorg.gradle.jvmargs="-Xmx4096m -XX:+HeapDumpOnOutOfMemoryError"'
export TERM_PROGRAM=iterm  # or whatever your favorite terminal program is
```

(optional) You may want install Jenv to manage multiple Java versions:

```bash
brew install jenv
eval "$(jenv init -)"
# next step assumes jdk already installed
jenv add /Library/Java/JavaVirtualMachines/zulu-11.jdk/Contents/Home
```

#### Linux

Install Java by running the following:

```
sudo apt install openjdk-11-jdk
```

You can download the complete Android Studio and SDK from the [Android Developer download site](https://developer.android.com/studio/#downloads).

You can find the complete instructions about how to install the tools in Linux environments in the [Documentation page](https://developer.android.com/studio/install#linux).

Set the following environment variables and optionally add to your shell profile (_e.g._, `.bash_profile`):

```bash
export ANDROID_HOME=/usr/local/share/android-sdk
export ANDROID_SDK_ROOT=/usr/local/share/android-sdk
# this is an optional gradle configuration that should make builds faster
export GRADLE_OPTS='-Dorg.gradle.daemon=true -Dorg.gradle.parallel=true -Dorg.gradle.jvmargs="-Xmx4096m -XX:+HeapDumpOnOutOfMemoryError"'
# this is used to launch the react native packager in its own terminal
export TERM_PROGRAM=xterm  # or whatever your favorite terminal is
```

##### Optional: Install an Android emulator

##### Configure an emulator using the Android SDK Manager

Set your `PATH` environment variable and optionally update your shell profile (_e.g._, `.bash_profile`):

```bash
export PATH=$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
```

Install the Android 31 system image and create an Android Virtual Device.

###### For Intel chip Macs:

```bash
sdkmanager "system-images;android-31;default;x86_64"
avdmanager create avd --force --name Pixel_API_31_AOSP_x86_64 --device pixel -k "system-images;android-31;default;x86_64"
```

###### For M1 Macs:

On an M1 mac, the above commands may succeed, but when you try to run the emulator it will fail saying you have an unsupported architecture. To get around this, you can manually create the Android Virtual Device in Android Studio by doing the following:

- Open the wallet repo in Android Studio. In the top bar, click Tools -> Device Manager. A side-bar should pop up on your screen showing your virtual devices (if any).
- Click "Create Device", choose a device (e.g. Pixel 6 Pro), and hit next.
- When prompted to select a system image, click the "ARM Images" tab, and choose an image where the target **does not** include "Google APIs". You may need to download the system image, to do that hit the download icon next to the release name. For e2e testing, choose release name "Q" a.k.a. Android 10.
- Give the device a name, and hit finish If you are creating a virtual device for e2e testing purposes, name your device `Pixel_API_29_AOSP_x86_64`.

Run the emulator with:

```bash
emulator -avd <virtual-device-name (e.g. Pixel_API_31_AOSP_x86_64)>
```

##### Install Genymotion Emulator Manager

Another Android emulator option is Genymotion.

###### MacOS

```bash
brew install --cask genymotion
```

Under OSX High Sierra and later, you'll get a message that you need to
[approve it in System Preferences > Security & Privacy > General][approve kernel extension].

Do that, and then repeat the line above.

Then make sure the ADB path is set correctly in Genymotion — set
`Preferences > ADB > Use custom Android SDK tools` to
`/usr/local/share/android-sdk` (same as `$ANDROID_HOME`)

###### Linux

You can download the Linux version of Genymotion from the [fun zone!](https://www.genymotion.com/fun-zone/) (you need to sign in first).

After having the binary you only need to run the installer:

```
sudo ./genymotion-3.0.2-linux_x64.bin
```

## Running the mobile wallet

The below steps should help you successfully run the mobile wallet on either a USB connected or emulated device. For additional information and troubleshooting see the [React Native docs][rn running on device].

**Note:** We've seen some issues running the metro bundler from iTerm

1. If you haven't already, run `yarn` and then `yarn build` from the repository root to install and build dependencies.

2. Attach your device or start an emulated one.

### iOS

3. Launch Xcode and use it to open the directory `celo.xcworkspace`. Confirm your iOS device has been detected by Xcode.

4. Build the project by pressing the play button in the top left corner or selecting `Product > Build` from the Xcode menu bar.

5. From the repository root directory run `yarn run dev:ios`.

### Android

3. Follow [these instructions to enable Developer Options][android dev options] on your Android device.

4. Unplug and replug your device. You'll be prompted to accept the connection and shown a public key (corresponding to the `abd_key.pub` file in `~/.android`)

5. To confirm your device is properly connected, running `adb devices` from the terminal should reflect your connected device. If it lists a device as "unauthorized", make sure you've accepted the prompt or [troubleshoot here][device unauthorized].

6. From the repository root directory run `yarn run dev:android`.

### Running on Mainnet

By default, the mobile wallet app runs on celo's testnet `alfajores`. To run the app on `mainnet`, supply an env flag, eg. `yarn run dev:ios -e mainnet`. The command will then run the app with the env file `.env.mainnet`.

### Reinstalling the app without building

To test some scenarios (e.g., native permissions modals which appear only once),
you may require a fresh install of the app. Instead of rebuilding the app to get
a fresh install, you can drag drop the generated app into the simulator after
uninstalling the app. It is typically available in the following paths:

- For iOS: `$HOME/Library/Developer/Xcode/DerivedData/celo-<randomid>/Build/Products/Debug-iphonesimulator/celo.app`
- For Android: `<path-to-wallet>/android/app/build/outputs/apk/alfajoresdev/debug/app-alfajoresdev-debug.apk`

## Debugging & App Profiling

### Debugging

Since we integrated dependencies making use of TurboModules, debugging via Chrome DevTools or React Native Debugger doesn't work anymore.
As an alternative, Flipper can be used instead.

#### Install Flipper

[Flipper][flipper] is a platform for debugging iOS, Android and React Native apps. Visualize, inspect, and control your apps from a simple desktop interface. Download on the web or through brew.

```sh
brew install flipper
```

As of Jan 2021, Flipper is not notarized and triggers a MacOS Gatekeeper popup when trying to run it for the first time.
Follow [these steps to successfully launch it](https://github.com/facebook/flipper/issues/1308#issuecomment-652951556) (only needed the very first time it's run)

The application currently makes use of 2 additional Flipper plugins to enable more detailed debugging:

- Redux Debugger (Flipper -> Manage Plugins -> Install Plugins -> search redux-debugger)
- React Navigation (Flipper -> Manage Plugins -> Install Plugins -> search react-navigation)

Once installed, you should be able to see them and interact with them when the wallet is running (only in dev builds).

This allows viewing / debugging the following:

- React DevTools (Components and Profiling)
- Network connections
- View hierarchy
- Redux State / Actions
- Navigation State
- AsyncStorage
- App preferences
- Hermes
- and more ;)

If you're using an Android simulator and the device / app is not showing up,
navigate to settings (gear icon in the bottom left) and ensure the Android SDK
location points to the same location as the $ANDROID_HOME environment variable.

### App Profiling with react-devtools

From Flipper select React DevTools Plugin while the app is running locally, or run `yarn run react-devtools` in the wallet root folder. It should automatically connect to the running app and includes a profiler (second tab). Start recording with the profiler, use the app and then stop recording. If running from the terminal, Flipper cannot be run at the same time.

The flame graph provides a view of each component and sub-component. The width is proportional to how long it took to load. If it is grey, it was not re-rendered at that 'commit' or DOM change. Details on the react native profiler are [here][rn profiler]. The biggest thing to look for are large number of renders when no state has changed. Reducing renders can be done via pure components in React or overloading the should component update method [example here][rn optimize example].

### App Profiling with Android Profiler

The [Android Profiler (standalone)][androidprofilerstandalone] is useful for viewing memory, CPU, and energy consumption. Run the profiler either from Android Studio or following the standalone instructions.

Release mode is preferred for profiling as memory usage can be significantly higher in development builds. To create a local mainnet release build for profiling run the app with `yarn dev:android -e mainnet -r -t`; this supplies an env flag: `-e <environment>`, the release flag: `-r` and the profile flag: `-t`. After both the app and profiler are launched, in the profiler attach a new session by selecting your device and a debuggable process e.g. `co.clabs.valora`.

## Testing

To execute the suite of tests, run `yarn test`.

### Snapshot testing

We use Jest [snapshot testing][jest] to assert that no intentional changes to the
component tree have been made without explicit developer intention. See an
example at [`src/send/SendAmount.test.tsx`]. If your snapshot is expected
to deviate, you can update the snapshot with the `-u` or `--updateSnapshot`
flag when running the test.

### React component unit testing

We use [react-native-testing-library][react-native-testing-library] and [@testing-library/jest-native][@testing-library/jest-native] to unit test
react components. It allows for deep rendering and interaction with the rendered
tree to assert proper reactions to user interaction and input. See an example at
[`src/send/SendAmount.test.tsx`] or read more about the [docs][rntl-docs].

To run a single component test file: `yarn test Send.test.tsx`

### Saga testing

We use [redux-saga-test-plan][redux-saga-test-plan] to test complex sagas.
See [`src/app/saga.test.ts`] for an example.

### End-to-End testing

We use [Detox][detox] for E2E testing. In order to run the tests locally, you
must have the proper emulator set up. Follow the instructions in [e2e/README.md][e2e readme].

Once setup is done, you can build the tests with `yarn e2e:build:android-release` or `yarn e2e:build:ios-release`.
Once test build is done, you can run the tests with `yarn e2e:test:android-release` or `yarn e2e:test:ios-release`.
If you want to run a single e2e test: `yarn e2e:test:ios-release Exchange.spec.js -t "Then Buy CELO"`

## Building APKs / Bundles

You can create your own custom build of the app via the command line or in Android Studio. For an exact set of commands, refer to the lanes in `fastlane/FastFile`. For convenience, the basic are described below:

### Creating a fake keystore

If you have not yet created a keystore, one will be required to generate a release APKs / bundles:

```sh
cd android/app
keytool -genkey -v -keystore celo-release-key.keystore -alias celo-key-alias -storepass celoFakeReleaseStorePass -keypass celoFakeReleaseKeyPass -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
export CELO_RELEASE_STORE_PASSWORD=celoFakeReleaseStorePass
export CELO_RELEASE_KEY_PASSWORD=celoFakeReleaseKeyPass
```

### Building an APK or Bundle

```sh
# With fastlane:
bundle install
bundle exec fastlane android build_apk env:YOUR_BUILDING_VARIANT

# Or, manually
cd android/
./gradlew clean
./gradlew bundle{YOUR_BUILDING_VARIANT}JsAndAssets
# For an APK:
./gradlew assemble{YOUR_BUILDING_VARIANT} -x bundle{YOUR_BUILDING_VARIANT}JsAndAssets
# Or for a bundle:
./gradlew bundle{YOUR_BUILDING_VARIANT} -x bundle{YOUR_BUILDING_VARIANT}JsAndAssets
```

Where `YOUR_BUILD_VARIANT` can be any of the app's build variants, such as debug or release.

## Other

### Localization (l10n) / translation process

We are using [Crowdin](https://clabs.crowdin.com/) to manage the translation of all user facing strings in the app.

During development, developers should only update the language files in the base locale. These are the source files for Crowdin.

The `main` branch of this repository is automatically synced with our Crowdin project. Source files in Crowdin are updated automatically and ready translations are pushed as a pull request.

Translation process overview:

1. Developers update the base strings in English (in `locales/base`) in the branch they are working on.
1. When the corresponding PR is merged into `main`, Crowdin integration automatically picks up changes to the base strings.
1. Crowdin then auto translates the new strings and opens a PR with them from the `l10n/main` branch
1. We can then manually check and edit the translated strings in the Crowdin UI. The changes will be reflected in the PR after 10 mins.
1. When we are happy with the changes, we can merge the PR and delete the related `l10n/main` branch to avoid possible future conflicts. Once new translations are made in Crowdin, a new `l10n/main` branch will be automatically created again.

When making a release, we should make sure there are no outstanding translation changes not yet merged into `main`.
i.e. no Crowdin PR open and the translation status for all supported languages is at 100% and approved on Crowdin.

Note that Crowdin Over-The-Air (OTA) content delivery is used to push live translation updates to the app. As only target languages are included in the Crowdin OTA distribution, English is set up as a target language as well as the source. This is a necessary implementation detail to prevent bi-directional sync between Crowdin and Github. The translated English strings (in `locales/en`) are only to receive the OTA translations, and it is not necessary to consume or edit them otherwise within the app.

### Configuring the SMS Retriever

On Android, the wallet app uses the SMS Retriever API to automatically input codes during phone number verification. When creating a new app build type this needs to be properly configured.

The service that route SMS messages to the app needs to be configured to [append this app signature to the message][sms retriever]. The hash depends on both the bundle id and the signing certificate. Since we use Google Play signing, we need to download the certificate.

1.  Go to the play console for the relevant app, Release management > App signing, and download the App signing certificate.
2.  Use this script to generate the hash code: https://github.com/michalbrz/sms-retriever-hash-generator

### Redux state migration

We're using [redux-persist](https://github.com/rt2zz/redux-persist) to persist the state of the app across launches.

Whenever we add/remove/update properties to the [RootState][rootstate], we need to ensure previous versions of the app can successfully migrate their persisted state to the new schema version.
Otherwise it can lead to subtle bugs or crashes for existing users of the app, when their app is upgraded.

We have automated checks to ensure that the state migration is working correctly across all versions. You're probably reading this because these checks pointed you to this documentation.
These checks are based on the JSON schema representation of the [RootState][rootstate] TypeScript type. It is stored in [test/RootStateSchema.json][rootstateschema].

#### When is a migration or new schema version needed?

As a rule of thumb, a migration is needed whenever the [RootState][rootstate] changes. That is whenever [test/RootStateSchema.json][rootstateschema] changes.

Here we're optimizing for correctness and explicitness to avoid breaking existing users.

[redux-persist](https://github.com/rt2zz/redux-persist) can automatically handle newly added properties with its [state reconcilier](https://github.com/rt2zz/redux-persist#state-reconciler).
However it leaves removed properties. Which is fine in the majority of the cases, but could create issues if later on a property is added again with the same name.
And it only merges the initial state with the persisted state up to 2 levels of nesting (this is the `autoMergeLevel2` config we are using).

So in general, if you're only adding a new reducer or adding a new property to an existing reducer, the migration can just return the input state. The state reconciler will do the right thing.

If you're deleting or updating existing properties, please implement the appropriate migration for them.

#### What do to when [test/RootStateSchema.json][rootstateschema] needs an update?

1. Run `yarn test:update-root-state-schema`. This will ensure the JSON schema is in sync with the [RootState][rootstate] TypeScript type.
2. Review the changes in the schema
3. Increase the schema version in [src/redux/store.ts](src/redux/store.ts#L27)
4. Add a new migration in [src/redux/migrations.ts](src/redux/migrations.ts)
5. Add a new test schema in [test/schema.ts](test/schema.ts), with the newly added/deleted/updated properties. The test schema is useful to test migrations and show how the schema changed over time.
6. Optional: if the migration is not trivial, add a test for it in [src/redux/migrations.test.ts](src/redux/migrations.test.ts)
7. Commit the changes

### Redux-Saga pitfalls

### Error bubbling

It's important to understand how errors propagate with Redux-Saga.

Take the following example:

```ts
function* rootSaga() {
  yield spawn(mySaga)
  yield spawn(someOtherSaga)
}

function* mySaga() {
  yield takeEvery('SEND_PAYMENT', sendPayment)
  yield takeEvery('NOTIFY_USER', notifyUser)
}

function* someOtherSaga() {
  // [...]
}
```

If an exception is thrown from `sendPayment` or `notifyUser`, the whole `mySaga` will be cancelled.
And won't handle `SEND_PAYMENT` AND `NOTIFY_USER` actions until the app is restarted.

Since `mySaga` was spawned from the root saga, `someOtherSaga` won't be affected though.

You may think that a good way to address this problem is to make sure `sendPayment` uses `try/catch`.

```ts
function* sendPayment() {
  try {
    // Code to send payment
    // [...]
  } catch (e) {
    Logger.error(e)
    yield put('SEND_PAYMENT_FAILED')
  }
}
```

However it's still possible that the `catch` block throws again, and we'd be back to the initial problem.

To avoid this problem, we recommend wrapping `takeEvery`/`takeLatest`/`takeLeading` worker sagas using the [`safely`](src/utils/safely.ts) helper.

Note that you should still handle errors happening in your action handlers. But at least you'll have the guarantee that it won't unexpectedly stop listening to actions because of an unhandled error.

See more details https://redux-saga.js.org/docs/api#error-propagation

### Why do we use http(s) provider?

Websockets (`ws`) would have been a better choice but we cannot use unencrypted `ws` provider since it would be bad to send plain-text data from a privacy perspective. Geth does not support `wss` by [default](https://github.com/ethereum/go-ethereum/issues/16423). And Kubernetes does not support it either. This forced us to use https provider.

### Helpful hints for development

We try to minimise the differences between running Valora in different modes and environments, however there are a few helpful things to know when developing the app.

- Valora uses Crowdin Over-The-Air (OTA) content delivery to enable dynamic translation updates. The OTA translations are cached and used on subsequent app loads instead of the strings in the translation files of the app bundle. This means that during development, the app will not respond to manual changes of the translation.json files.
- In development mode, analytics are disabled.

### Vulnerabilities found in dependencies

We have a script to [check for vulnerabilities](scripts/ci_check_vulnerabilities.sh) in our dependencies.

The script reports all vulnerabilities found; compare its output with [yarn-audit-known-issues](/yarn-audit-known-issues) to see which ones are new.

In case vulnerabilities are reported, check to see if they apply to production and if they have fixes available.

If they apply to production, start a discussion in our [#on-call](https://valora-app.slack.com/archives/C02N3AR2P2S) channel.

Then if they have fixes available, update the dependencies using [Renovate](https://github.com/valora-inc/wallet/issues/1716) or manually:

- If it's a direct dependency, update the dependency in `package.json`.
- If it's a transitive dependency, you can manually remove the transitive dependency in `yarn.lock` and re-run `yarn install` to see if it can use the fixed version. If the sub dependency is pinned somewhere, you'll need to use a [yarn resolution](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) in `package.json` to get the fixed version. Be careful with this as it can break other dependencies depending on a specific version.

If they do not have fixes and they do not apply to production, you may ignore them:

1. run: `yarn audit --json --groups dependencies --level high | grep auditAdvisory > yarn-audit-known-issues`
2. commit `yarn-audit-known-issues` and open a PR

### Branding (for Valora employees only)

Images and icons in Valora are stored in the [branding repo](https://github.com/valora-inc/valora-app-branding). When running `yarn install`, the script `scripts/sync_branding.sh` is run to clone this repo into `branding/valora`, and these assets are then put into `src/images` and `src/icons`. If you do not have access to the branding repo, assets are pulled from `branding/celo`, and are displayed as pink squares instead. The jest tests and CircleCI pipeline also use these default assets.

When adding new images to the [branding repo](https://github.com/valora-inc/valora-app-branding), we also include the 1.5x, 2x, 3x, and 4x versions. The app will automatically download the appropriate size. After making changes to the remote repo, find the commit hash and update it in `scripts/sync_branding.sh`. Make sure to also add the corresponding pink square version of the images to `branding/celo/src/images`. You can do this by copying one of the existing files and renaming it.

### Troubleshooting

#### Postinstall script

If you're having an error with installing packages, or `secrets.json` not existing:

try to run `yarn postinstall` in the wallet root folder after running `yarn install`.

If some of your assets are not loaded and you see an error running sync_branding.sh.
Check if you have set up your Github connection with SSH.

A successful `yarn postinstall` looks like:

```
$ yarn postinstall
yarn run v1.22.17
$ patch-package && yarn keys:decrypt && yarn run unzipCeloClient && ./scripts/sync_branding.sh && ./scripts/copy_license_to_android_assets.sh
patch-package 6.2.2
Applying patches...
@react-native-community/netinfo@5.8.0 ✔
bn.js@4.11.9 ✔
clevertap-react-native@0.5.2 ✔
react-native-fast-crypto@2.0.0 ✔
react-native-securerandom@1.0.0 ✔
react-native-sms@1.11.0 ✔
react-native-splash-screen@3.3.0 ✔
react-native-svg@12.1.1 ✔
react-native-tab-view@2.15.2 ✔
react-native-webview@11.6.5 ✔
$ bash scripts/key_placer.sh decrypt
Processing encrypted files
Encrypted files decrypted
.
~/src/github.com/valora-inc/wallet/branding/valora ~/src/github.com/valora-inc/wallet
HEAD is now at ec0637b fix: update valora forum link (#9)
~/src/github.com/valora-inc/wallet
Using branding/valora
building file list ... done

sent 7697 bytes  received 20 bytes  15434.00 bytes/sec
total size is 8003608  speedup is 1037.14
building file list ... done

sent 91 bytes  received 20 bytes  222.00 bytes/sec
total size is 1465080  speedup is 13198.92
✨  Done in 12.77s.
```

#### `Activity class {org.celo.mobile.staging/org.celo.mobile.MainActivity} does not exist.`

From time to time the app refuses to start showing this error:

```text
557 actionable tasks: 525 executed, 32 up-to-date
info Running /usr/local/share/android-sdk/platform-tools/adb -s PL2GARH861213542 reverse tcp:8081 tcp:8081
info Starting the app on PL2GARH861213542 (/usr/local/share/android-sdk/platform-tools/adb -s PL2GARH861213542 shell am start -n org.celo.mobile.staging/org.celo.mobile.MainActivity)...
Starting: Intent { cmp=org.celo.mobile.staging/org.celo.mobile.MainActivity }
Error type 3
Error: Activity class {org.celo.mobile.staging/org.celo.mobile.MainActivity} does not exist.
```

Solution:

```bash
$ adb kill-server && adb start-server
* daemon not running; starting now at tcp:5037
* daemon started successfully
```

#### Podfile changes not picked up by iOS build

Some [Podfile](ios/Podfile) changes may not be picked up by an iOS build (e.g.,
add new permissions with react-native-permissions [here](ios/Podfile#L37)) and
will need cleaning the XCode derived data folder.

```console
rm -rf $HOME/Library/Developer/Xcode/DerivedData/*
```

[celo platform]: https://celo.org
[wallet]: https://github.com/valora-inc/wallet
[celo-blockchain]: https://github.com/celo-org/celo-blockchain
[apple developer program]: https://developer.apple.com/programs/
[detox]: https://github.com/wix/Detox
[e2e readme]: ./e2e/README.md
[protocol readme]: ../protocol/README.md
[react native]: https://facebook.github.io/react-native/
[flipper]: https://fbflipper.com
[rn optimize example]: https://reactjs.org/docs/optimizing-performance.html#examples
[rn profiler]: https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html
[rn running on device]: https://facebook.github.io/react-native/docs/running-on-device
[setup]: ../../SETUP.md
[react-native-testing-library]: https://github.com/callstack/react-native-testing-library
[@testing-library/jest-native]: https://github.com/testing-library/jest-native#readme
[rntl-docs]: https://callstack.github.io/react-native-testing-library/docs/getting-started
[jest]: https://jestjs.io/docs/en/snapshot-testing
[redux-saga-test-plan]: https://github.com/jfairbank/redux-saga-test-plan
[sms retriever]: https://developers.google.com/identity/sms-retriever/verify#1_construct_a_verification_message
[android dev options]: https://developer.android.com/studio/debug/dev-options
[android ndk]: https://developer.android.com/studio/projects/install-ndk
[android studio]: https://developer.android.com/studio
[approve kernel extension]: https://developer.apple.com/library/content/technotes/tn2459/_index.html
[device unauthorized]: https://stackoverflow.com/questions/23081263/adb-android-device-unauthorized
[watchman]: https://facebook.github.io/watchman/docs/install/
[jq]: https://stedolan.github.io/jq/
[rootstate]: src/redux/reducers.ts#L79
[rootstateschema]: test/RootStateSchema.json
[androidprofilerstandalone]: https://developer.android.com/studio/profile/android-profiler#standalone-profilers

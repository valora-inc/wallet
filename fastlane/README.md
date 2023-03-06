fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## Android

### android clean

```sh
[bundle exec] fastlane android clean
```

Clean the Android application

### android build

```sh
[bundle exec] fastlane android build
```

Build the Android application - requires environment param

### android upload

```sh
[bundle exec] fastlane android upload
```

Upload to the Play Store

### android alfajores

```sh
[bundle exec] fastlane android alfajores
```

Ship Alfajores to Playstore Internal

### android alfajoresnightly

```sh
[bundle exec] fastlane android alfajoresnightly
```

Ship Alfajores Nightly to Playstore Internal

### android mainnet

```sh
[bundle exec] fastlane android mainnet
```

Ship Mainnet to Playstore Internal

### android mainnetnightly

```sh
[bundle exec] fastlane android mainnetnightly
```

Ship Mainnet Nightly to Playstore Internal

### android build_apk

```sh
[bundle exec] fastlane android build_apk
```

Build an Android apk

### android build_bundle

```sh
[bundle exec] fastlane android build_bundle
```

Build an Android bundle

----


## iOS

### ios build

```sh
[bundle exec] fastlane ios build
```

Build the iOS application - requires environment param

### ios upload

```sh
[bundle exec] fastlane ios upload
```

Upload to TestFlight

### ios alfajores

```sh
[bundle exec] fastlane ios alfajores
```

Ship Alfajores to TestFlight

### ios alfajoresnightly

```sh
[bundle exec] fastlane ios alfajoresnightly
```

Ship Alfajores Nightly to TestFlight

### ios mainnet

```sh
[bundle exec] fastlane ios mainnet
```

Ship Mainnet to TestFlight

### ios mainnetnightly

```sh
[bundle exec] fastlane ios mainnetnightly
```

Ship Mainnet Nightly to TestFlight

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).

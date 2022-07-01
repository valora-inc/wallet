# Android Build Environment

## OSX Mac M1

If you're using Mac M1 or a later version of Mac OSX, then it is advised that you do not install `android-sdk` and `android-platform-tools` via homebrew, as they are soon to be deprecated.

### Installing Java Development Kit (JDK)

Use the following command to install the latest JDK. Zulu Open JDK is recommended because it supports both Intel and M1 processors.

```sh
brew tap homebrew/cask-versions
brew install --cask zulu11
```

### Installing Android SDK and Platform Tools

Follow the standard instructions for installing the Android SDK and Platform Tools using Android Studio, then modify your path to exose the required commands in CLI.

```sh
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/emulator
export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools
```
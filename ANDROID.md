# Android Build Environment

## OSX Mac M1

If you're using Mac M1 or a later version of Mac OSX, then it is advised that you do not install `android-sdk` and `android-platform-tools` via homebrew, as they are soon to be deprecated.

### Installing Android SDK and Android Platform Tools

Use the Android Studio "SDK Manager" to install the Android Platform Tools.

Keep note of the path to the Android SDK, in my case, it is located at:

```sh
/User/<name>/Library/Android/sdk/
```

Next, to use Android SDK and Platform Tools via the command line, we will alias them.

```sh
export $ANDROID_HOME=/User/<name>/Library/Android/sdk
alias sdkmanager=$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager
alias avdmanager=$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager
```

Ensure that your `~/.zprofile` is udpated with the above variables.

### Running Android Commands

Now, you will be able to natively run `sdkmanager` and `avdmanager` commands from the command line based on the installation provided by Android Studio.

#!/usr/bin/env bash
set -euo pipefail

# Default ENVFILE if not set
export ENVFILE="${ENVFILE:-.env.test}"

# ========================================
# Build and run the end-to-end tests
# ========================================

# Flags:
# -p: Platform (android or ios)
# -v (Optional): Name of virual machine to run
# -r (Optional): Use release build (by default uses debug)
# TODO ^ release doesn't work currently b.c. the run_app.sh script assumes we want a debug build
# -n (Optional): Network delay (gsm, hscsd, gprs, edge, umts, hsdpa, lte, evdo, none)
# -d (Optional): Run in dev mode, which doesn't rebuild or reinstall the app and doesn't restart the packager.
# -t (Optional): Run a specific test file only.
# -w (Optional): Run specifies the number of emulators to run tests in parallel default is 3

PLATFORM=""
VD_NAME="Pixel_API_29_AOSP_x86_64"
RELEASE=false
NET_DELAY="none"
DEV_MODE=false
FILE_TO_RUN=""
TEST_MATCH=""
WORKERS=1
RETRIES=0
extra_param=""
while getopts 'p:f:t:v:n:w:j:rd' flag; do
  case "${flag}" in
    p) PLATFORM="$OPTARG" ;;
    v) VD_NAME="$OPTARG" ;;
    r) RELEASE=true ;;
    n) NET_DELAY="$OPTARG" ;;
    d) DEV_MODE=true ;;
    f) FILE_TO_RUN=$OPTARG ;;
    t) TEST_MATCH=$OPTARG ;;
    w) WORKERS="$OPTARG" ;;
    j) RETRIES="$OPTARG" ;;
    *) error "Unexpected option ${flag}" ;;
  esac
done

[ -z "$PLATFORM" ] && echo "Need to set the PLATFORM via the -p flag" && exit 1;
echo "Network delay: $NET_DELAY"

# Start the packager and wait until ready
startPackager() {
    if [ "$RELEASE" = true ]; then
      echo "Skipping metro packager in release mode"
      return
    fi
    
    echo "Starting metro packager"
    yarn react-native start &

    waitForPackager
    preloadBundle
}

# Wait for the package to start
waitForPackager() {
  local -i max_attempts=60
  local -i attempt_num=1

  until curl -s http://localhost:8081/status | grep "packager-status:running" -q; do
    if (( attempt_num == max_attempts )); then
      echo "Packager did not respond in time. No more attempts left."
      exit 1
    else
      (( attempt_num++ ))
      echo "Packager did not respond. Retrying for attempt number $attempt_num..."
      sleep 1
    fi
  done

  echo "Packager is ready!"
}

# Preload bundle, this is to prevent random red screen "Could not connect to development server" on the CI
preloadBundle() {
  echo "Preloading bundle..."
  local response_code=$(curl --write-out %{http_code} --silent --output /dev/null "http://localhost:8081/index.bundle?platform=$PLATFORM&dev=true")
  if [ "$response_code" != "200" ]; then
    echo "Failed to preload bundle, http response code: $response_code"
    exit 1
  fi
  echo "Preload bundle finished with http code: $response_code"
}

runTest() {
  if [[ $DEV_MODE == true ]]; then
    extra_param="--reuse"
  fi
  test_match=""
  if [[ $TEST_MATCH ]]; then
    test_match="-t='$TEST_MATCH'"
  fi
  yarn detox test \
    --configuration $CONFIG_NAME \
    "${FILE_TO_RUN}" \
    --artifacts-location e2e/artifacts \
    --take-screenshots=failing \
    --record-logs=failing \
    --loglevel info \
    --debug-synchronization 10000 \
    --workers $WORKERS \
    --retries $RETRIES \
    --headless \
    --record-videos=failing \
    "${test_match}" \
    "${extra_param}" 
  TEST_STATUS=$?
}

# Needed by metro packager to use .e2e.ts overrides
# See metro.config.js
export CELO_TEST_CONFIG=e2e

if [ $DEV_MODE = false ]; then
  # Just to be safe kill any process that listens on the port 'yarn start' is going to use
  echo "Killing previous metro server (if any)"
  yarn react-native-kill-packager || echo "Failed to kill package manager, proceeding anyway"
fi

# Build the app and run it
if [ $PLATFORM = "android" ]; then
  echo "Using platform android"

  if [ -z $ANDROID_SDK_ROOT ]; then
    echo "No Android SDK root set"
    exit 1
  fi

  if [[ ! $($ANDROID_SDK_ROOT/emulator/emulator -list-avds | grep ^$VD_NAME$) ]]; then
    echo "AVD $VD_NAME not installed. Please install it or change the detox configuration in package.json"
    echo "You can see the list of available installed devices with $ANDROID_SDK_ROOT/emulator/emulator -list-avds"
    exit 1
  fi

  if [ "$RELEASE" = false ]; then
    CONFIG_NAME="android.debug"
  else
    CONFIG_NAME="android.release"
  fi

  if [ $DEV_MODE = false ]; then
    echo "Building detox"
    yarn detox build -c $CONFIG_NAME

    NUM_DEVICES=`adb devices -l | grep emulator- | wc -l` || echo "0" | bc
    if [ $NUM_DEVICES -ge 1 ]; then
      echo "$NUM_DEVICES emulator(s) already running or attached, removing"
      adb devices | grep emulator | cut -f1 | while read line; do adb -s $line emu kill; done
    fi

    startPackager

    for ((i=1; i<=$WORKERS; i=i+1))
    do
      echo "Starting the emulator"
      $ANDROID_SDK_ROOT/emulator/emulator \
        -avd $VD_NAME \
        -no-boot-anim \
        -noaudio \
        -verbose \
        -read-only \
        -netdelay $NET_DELAY \
        -gpu swiftshader_indirect \
        -no-window \
        -snapshot ci_boot \
        &
    done

    # Give a few second for emulators to launch
    sleep 3
    echo `adb devices`
    for DEVICE in `adb devices| grep emulator| cut -f1`; do
      echo "Waiting for ${DEVICE} to connect to Wifi, this is a good proxy the device is ready"
      until [ `adb -s ${DEVICE} shell dumpsys wifi | grep "mNetworkInfo" | grep "state: CONNECTED" | wc -l` -gt 0 ]
      do
        sleep 3
      done
    done
  fi

  # Run Detox Tests
  runTest

  if [ $DEV_MODE = false ]; then
    echo "Closing emulator (if active)"
    adb devices | grep emulator | cut -f1 | while read line; do adb -s $line emu kill; done
  fi

elif [ $PLATFORM = "ios" ]; then
  echo "Using platform ios"

  if [ "$RELEASE" = false ]; then
    CONFIG_NAME="ios.debug"
  else
    CONFIG_NAME="ios.release"
  fi

  if [ $DEV_MODE = false ]; then
    echo "Building detox"
    yarn detox build -c $CONFIG_NAME

    startPackager
  fi

  runTest

else
  echo "Invalid value for platform, must be 'android' or 'ios'"
  exit 1
fi

echo "Done test, cleaning up"
if [ $DEV_MODE = false ]; then
  yarn react-native-kill-packager
fi

echo "Exiting with test result status $TEST_STATUS"
exit $TEST_STATUS

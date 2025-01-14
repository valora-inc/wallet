const iosName = 'MobileStack'
const derivedDataPath = 'ios/build'
const sdk = 'iphonesimulator'

module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: require.resolve('./e2e/jest.config.js'),
      _: ['e2e'],
    },
    forwardEnv: true,
  },
  apps: {
    'ios.release': {
      type: 'ios.app',
      binaryPath: `${derivedDataPath}/Build/Products/Release-${sdk}/${iosName}.app`,
      build: `set -o pipefail && xcodebuild -workspace ios/${iosName}.xcworkspace -scheme ${iosName} -configuration Release -sdk iphonesimulator -derivedDataPath ${derivedDataPath} 2>&1 | npx excpretty ./`,
    },
    'ios.debug': {
      type: 'ios.app',
      binaryPath: `${derivedDataPath}/Build/Products/Debug-${sdk}/${iosName}.app`,
      build: `set -o pipefail && xcodebuild -workspace ios/${iosName}.xcworkspace -scheme ${iosName} -configuration Debug -sdk iphonesimulator -derivedDataPath ${derivedDataPath} 2>&1 | npx excpretty ./`,
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'pushd android && ./gradlew app:assembleDebug app:assembleAndroidTest -DtestBuildType=debug && popd',
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build:
        'pushd android && ./gradlew app:assembleRelease app:assembleAndroidTest -DtestBuildType=release && popd',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone SE (2nd generation)',
      },
    },
    'simulator.15.2': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone SE (2nd generation)',
        os: 'iOS 15.2',
      },
    },
    'simulator.17.2': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone SE (3rd generation)',
        os: 'iOS 17.2',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_API_29_AOSP_x86_64',
      },
      utilBinaryPaths: ['./e2e/test-butler-app.apk'],
    },
  },
  configurations: {
    'ios.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'ios.release.15.2': {
      device: 'simulator.15.2',
      app: 'ios.release',
    },
    'ios.release.17.2': {
      device: 'simulator.17.2',
      app: 'ios.release',
    },
    'android.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
}

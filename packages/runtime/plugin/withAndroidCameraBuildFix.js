const { withAppBuildGradle } = require("@expo/config-plugins");

const SEARCH_STRING = "defaultConfig {";

// Temporary plugin to fix the camera build issue on Android
// See https://github.com/react-native-camera/react-native-camera/issues/3480#issuecomment-1572670300
// We can remove this once we migrate to another camera library
// Also would be good to use TS for longer term plugins
// See https://github.com/expo/expo/tree/main/packages/expo-module-scripts#-config-plugin
module.exports = function withAndroidCameraBuildFix(config) {
  return withAppBuildGradle(config, (config) => {
    const initialIndex = config.modResults.contents.indexOf(SEARCH_STRING);

    config.modResults.contents =
      config.modResults.contents.slice(0, initialIndex + SEARCH_STRING.length) +
      `\n        missingDimensionStrategy 'react-native-camera', 'general'` +
      config.modResults.contents.slice(initialIndex + SEARCH_STRING.length);

    return config;
  });
};
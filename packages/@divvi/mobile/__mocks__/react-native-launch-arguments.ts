// This mock is required because otherwise all tests that include
// src/statsig/index.ts as part of its import fail with an undefined access on
// this line
// https://github.com/iamolegga/react-native-launch-arguments/blob/d603bd919844c1db78192f4331b77e159cbeb2ac/src/index.ts#L11
// (NativeModules.LaunchArguments is undefined)
export const LaunchArguments = {
  value: jest.fn(),
}

const Reanimated = require('react-native-reanimated/mock')

// The mock for `call` immediately calls the callback which is incorrect
// So we override it with a no-op
Reanimated.default.call = () => {}

module.exports = {
  ...Reanimated,
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(),
  makeMutable: jest.fn(),
  useWorkletCallback: jest.fn(),
  runOnUI: () => jest.fn(),
}

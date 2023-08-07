import '@testing-library/jest-native/extend-expect'
import 'react-native-svg-mock'

jest.useFakeTimers()

if (typeof window !== 'object') {
  // @ts-ignore
  global.window = global
  // @ts-ignore
  global.window.navigator = {}
}

// @ts-ignore
global.fetch = require('jest-fetch-mock')

// Mock LayoutAnimation as it's done not automatically
jest.mock('react-native/Libraries/LayoutAnimation/LayoutAnimation.js')

// Mock Animated Views this way otherwise we get a
// `JavaScript heap out of memory` error when a ref is set (?!)
// See https://github.com/callstack/react-native-testing-library/issues/539
jest.mock('react-native/Libraries/Animated/components/AnimatedView.js', () => 'View')
jest.mock('react-native/Libraries/Animated/components/AnimatedScrollView.js', () => 'RCTScrollView')

// Mock ToastAndroid as it's not done automatically
jest.mock('react-native/Libraries/Components/ToastAndroid/ToastAndroid.android.js', () => ({
  show: jest.fn(),
  showWithGravity: jest.fn(),
  showWithGravityAndOffset: jest.fn(),
}))

// Mock Pixel Ratio to always return 1
jest.mock('react-native/Libraries/Utilities/PixelRatio.js', () => ({
  roundToNearestPixel: jest.fn(() => 1),
  getPixelSizeForLayoutSize: jest.fn(() => 1),
  getFontScale: jest.fn(() => 1),
}))

// @ts-ignore
global.__reanimatedWorkletInit = jest.fn()

// avoid side effects from importing Torus dependencies while testing (doing so unmocks fetch, even for unrelated tests)
// TODO may need to remove once we update to use latest Torus/Web3Auth API https://linear.app/valora/issue/ACT-876
jest.mock('@toruslabs/torus.js', () => jest.fn())
jest.mock('@toruslabs/fetch-node-details', () => jest.fn())

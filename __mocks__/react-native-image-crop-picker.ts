// This mock is required because otherwise all tests that include
// react-native-image-crop-picker as part of its import fail with an undefined access on
// this line
// https://github.com/ivpusic/react-native-image-crop-picker/blob/0efb16c0f66c493d8f2100049f03429660c6ba78/index.js#L8
// (NativeModules.ImageCropPicker is undefined)
export default {
  openPicker: jest.fn(),
  openCamera: jest.fn(),
}

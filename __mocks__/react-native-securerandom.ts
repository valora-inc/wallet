import { NativeModules } from 'react-native'
const { randomBytes } = require('crypto')

NativeModules.RNSecureRandom = {
  generateSecureRandomAsBase64: jest
    .fn()
    .mockImplementation(async (length) => randomBytes(length).toString('base64')),
}

module.exports = {
  ...jest.requireActual('react-native-securerandom'),
}

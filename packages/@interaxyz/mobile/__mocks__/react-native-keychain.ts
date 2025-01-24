const mockedItems = new Map<string, any>()

const keychainMock = {
  SECURITY_LEVEL_ANY: 'MOCK_SECURITY_LEVEL_ANY',
  SECURITY_LEVEL_SECURE_SOFTWARE: 'MOCK_SECURITY_LEVEL_SECURE_SOFTWARE',
  SECURITY_LEVEL_SECURE_HARDWARE: 'MOCK_SECURITY_LEVEL_SECURE_HARDWARE',
  ACCESSIBLE: {
    ALWAYS_THIS_DEVICE_ONLY: 'always',
  },
  SECURITY_RULES: {
    NONE: 'none',
  },
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET: 'BiometryCurrentSet',
  },
  AUTHENTICATION_TYPE: {
    BIOMETRICS: 'AuthenticationWithBiometrics',
  },
  BIOMETRY_TYPE: {
    TOUCH_ID: 'TouchID',
    FACE_ID: 'FaceID',
    FINGERPRINT: 'Fingerprint',
    FACE: 'Face',
    IRIS: 'Iris',
  },
  SECURITY_LEVEL: {
    SECURE_SOFTWARE: 'SECURE_SOFTWARE',
    SECURE_HARDWARE: 'SECURE_HARDWARE',
    ANY: 'ANY',
  },
  setGenericPassword: jest.fn(async (username, password, options) => {
    mockedItems.set(options.service, { username, password, options })
    return true
  }),
  getGenericPassword: jest.fn(async (options) => {
    const item = mockedItems.get(options.service)
    if (!item) {
      return null
    }
    return {
      username: item.username,
      password: item.password,
    }
  }),
  resetGenericPassword: jest.fn(async (options) => {
    return mockedItems.delete(options.service)
  }),
  getAllGenericPasswordServices: jest.fn(async () => {
    return Array.from(mockedItems.keys())
  }),
  getSupportedBiometryType: () => Promise.resolve('TouchID'),

  // Expose for testing purposes
  mockedItems,
}

module.exports = keychainMock

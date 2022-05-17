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
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}

module.exports = keychainMock

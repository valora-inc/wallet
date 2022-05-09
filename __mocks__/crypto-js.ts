module.exports = {
  ...(jest.requireActual('crypto-js') as any),
  AES: {
    ...(jest.requireActual('crypto-js').AES as any),
    encrypt: jest.fn().mockReturnValue('mockEncryptedValue'),
    decrypt: jest.fn().mockReturnValue('mockDecryptedValue'),
  },
}

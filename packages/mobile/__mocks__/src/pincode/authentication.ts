module.exports = {
  ...jest.requireActual('src/pincode/authentication'),
  ensureCorrectPassword: jest.fn(() => true),
  checkPin: jest.fn().mockResolvedValue(true),
  getPincodeWithBiometry: jest.fn().mockResolvedValue('123456'),
  updatePin: jest.fn(async () => true),
  getPassword: jest.fn(
    async () => '0000000000000000000000000000000000000000000000000000000000000001' + '111555'
  ),
  getPasswordSaga: jest.fn(function* () {
    return '0000000000000000000000000000000000000000000000000000000000000001' + '111555'
  }),
  setPincodeWithBiometry: jest
    .fn()
    .mockResolvedValue({ service: 'some service', storage: 'some storage' }),
  removeStoredPin: jest.fn().mockResolvedValue(true),
  requestPincodeInput: jest.fn().mockResolvedValue('123123'),
}

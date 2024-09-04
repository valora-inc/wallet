const mockViemAccount = {
  address: '0x1234',
  privateKey: '0x1234',
  signTransaction: jest.fn().mockReturnValue('0x123456789'),
  signTypedData: jest.fn().mockReturnValue('0x123456789'),
  signMessage: jest.fn().mockReturnValue('0x123456789'),
}

const mockKeychainAccounts = {
  loadExistingAccounts: jest.fn(),
  addAccount: jest.fn(),
  updatePassphrase: jest.fn(),
  isUnlocked: jest.fn(),
  getViemAccount: jest.fn().mockReturnValue(mockViemAccount),
  unlock: jest.fn(),
}

export const getKeychainAccounts = jest.fn().mockResolvedValue(mockKeychainAccounts)

const mockViemWallet = {
  account: mockViemAccount,
  sendTransaction: jest.fn().mockReturnValue('0x123456789'),
  sendRawTransaction: jest.fn().mockReturnValue('0x123456789'),
  signTransaction: jest.fn().mockReturnValue('0x123456789'),
  signTypedData: jest.fn().mockReturnValue('0x123456789'),
  signMessage: jest.fn().mockReturnValue('0x123456789'),
  writeContract: jest.fn().mockReturnValue('0x123456789'),
}

export function* getViemWallet() {
  return mockViemWallet
}

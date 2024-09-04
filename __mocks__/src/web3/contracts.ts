import { privateKeyToAddress } from '@celo/utils/lib/address'

export const initContractKit = jest.fn()

const mockWallet = {
  addAccount: jest.fn(async (privateKey: string, passphrase: string) =>
    privateKeyToAddress(privateKey)
  ),
  updateAccount: jest.fn().mockResolvedValue(true),
  unlockAccount: jest.fn(),
  isAccountUnlocked: jest.fn(() => true),
  signPersonalMessage: jest.fn(),
}

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
}

export function* getWallet() {
  return mockWallet
}

export async function getWalletAsync() {
  return mockWallet
}

export async function getKeychainAccounts() {
  return mockKeychainAccounts
}

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

import { newKitFromWeb3 } from '@celo/contractkit'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import Web3 from 'web3'

export const initContractKit = jest.fn()

const contractKit = newKitFromWeb3(new Web3())

export function* getContractKit() {
  return contractKit
}

export async function getContractKitAsync() {
  return contractKit
}

const mockWallet = {
  addAccount: jest.fn(async (privateKey: string, passphrase: string) =>
    privateKeyToAddress(privateKey)
  ),
  updateAccount: jest.fn().mockResolvedValue(true),
  unlockAccount: jest.fn(),
  isAccountUnlocked: jest.fn(() => true),
  signPersonalMessage: jest.fn(),
}

export function* getWallet() {
  return mockWallet
}

export async function getWalletAsync() {
  return mockWallet
}

const mockViemWallet = {
  account: { address: '0x1234' },
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

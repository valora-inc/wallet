import { TypedDataDomain, TypedDataField } from 'ethers'
import { CeloTx, EncodedTransaction } from '@celo/connect'

// Generic wrapper interface for implementation-agnostic, lockable wallets used in Valora.
// A "wallet" is responsible for managing an arbitrary number of "accounts" (i.e.,
// unique addresses or signers) on a single blockchain. The methods defined here span
// all the functionality currently expected of a "wallet" by the application.
//
// The types used for these methods are largely taken from Ethers where it was straightforward
// to modify callsites to adhere to the new types. signTransaction is a notable deviation from
// this due to its complexity.
// TODO: Update signTransaction to use Ethers types.
export interface ValoraWallet {
  // Sign EIP712 typed data
  signTypedData(
    address: string,
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>,
    primaryType: string
  ): Promise<string>
  signTransaction(tx: CeloTx): Promise<EncodedTransaction>
  // Sign a personal message with the given account, without hashing it
  signPersonalMessage(address: string, data: string): Promise<string>
  // Decrypt generic ciphertext Buffer for the given accountq
  decryptMessage(address: string, ciphertext: Buffer): Promise<string>
  // Get a list of accounts that this wallet
  // is responsible for managing
  getAccounts(): string[]
  // Check if an account exists
  hasAccount(address?: string): boolean
  // Add an account to the wallet, using a passphrase as a pepper
  addAccount(privateKey: string, password: string): Promise<string>
  // Unlock an account for a given duration, given its pepper
  unlockAccount(address: string, password: string, duration: number): Promise<boolean>
  // Check if a given account is unlocked
  isAccountUnlocked(address: string): boolean
  // Update an account password
  updateAccount(address: string, oldPassword: string, newPassword: string): Promise<boolean>
}

export interface KeychainAccount {
  address: string
  createdAt: Date
  importFromMnemonic?: boolean
}

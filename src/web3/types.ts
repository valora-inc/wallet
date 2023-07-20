import { TypedDataDomain, TypedDataField, TransactionRequest } from 'ethers'
import { CeloTx, EncodedTransaction } from '@celo/connect'

export enum WalletTxType {
  Ethers = 'Ethers',
  ContractKit = 'ContractKit',
}
type SignTransactionInputType<T extends WalletTxType> = T extends WalletTxType.Ethers
  ? TransactionRequest
  : CeloTx
type SignTransactionOutputType<T extends WalletTxType> = T extends WalletTxType.Ethers
  ? string
  : EncodedTransaction

// Generic wrapper interface for implementation-agnostic, lockable wallets used in Valora.
// A "wallet" is responsible for managing an arbitrary number of "accounts" (i.e.,
// unique addresses or signers) on a single blockchain. The methods defined here span
// all the functionality currently expected of a "wallet" by the application.
//
// The types used for these methods are largely taken from Ethers where it was straightforward
// to modify callsites to adhere to the new types. Since it's not simple to transform the current
// input/output types of signTransaction to adhere to Ethers types (or vice-versa), this class is
// generic in order to support either set of types. This genericization means that when transitioning
// from a ContractKit wallet to an Ethers wallet, the only  method signature that needs to change is
// signTransaction.
export interface ValoraWallet<T extends WalletTxType> {
  // Sign EIP712 typed data
  signTypedData(
    address: string,
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>,
    primaryType: string
  ): Promise<string>
  signTransaction(tx: SignTransactionInputType<T>): Promise<SignTransactionOutputType<T>>
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

// This is a convenience type to control the type of wallet used throughout the app.
// Switching the transaction type here will modify the expected signature of the signTransaction
// method throughout the app.
// TODO: Switch this to WalletTxType.Ethers when we're ready to make the switch to using Ethers globally
export type PrimaryValoraWallet = ValoraWallet<WalletTxType.ContractKit>

export interface KeychainAccount {
  address: string
  createdAt: Date
  importFromMnemonic?: boolean
}

import { ValoraWallet, WalletTxType } from 'src/web3/types'
import { KeychainWallet } from 'src/web3/KeychainWallet'
import { ImportMnemonicAccount } from 'src/web3/KeychainSigner'
import { TypedDataDomain, TypedDataField } from 'ethers'
import { omitBy, isNil } from 'lodash'
import KeychainAccountManager from 'src/web3/KeychainAccountManager'
import { CeloTx, EncodedTransaction } from '@celo/connect'

class ValoraCeloWallet implements ValoraWallet<WalletTxType.ContractKit> {
  private keychainWallet: KeychainWallet

  constructor(
    private importMnemonicAccount: ImportMnemonicAccount,
    private keychainAccountManager: KeychainAccountManager
  ) {
    this.keychainWallet = new KeychainWallet(
      this.importMnemonicAccount,
      this.keychainAccountManager
    )
  }

  async init() {
    await this.keychainWallet.init()
  }

  async signTypedData(
    address: string,
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>,
    primaryType: string
  ): Promise<string> {
    if (!this.isAccountUnlocked(address)) {
      throw new Error('Authentication needed')
    }
    return await this.keychainWallet.signTypedData(address, {
      types: {
        ...types,
        EIP712Domain: types?.EIP712Domain ?? [],
      },
      domain: omitBy(domain, isNil),
      message: value,
      primaryType,
    })
  }

  async signTransaction(tx: CeloTx): Promise<EncodedTransaction> {
    if (!tx.from || !this.isAccountUnlocked(tx.from.toString())) {
      throw new Error('Authentication needed')
    }
    return await this.keychainWallet.signTransaction(tx)
  }

  async signPersonalMessage(address: string, data: string): Promise<string> {
    if (!this.isAccountUnlocked(address)) {
      throw new Error('Authentication needed')
    }
    return await this.keychainWallet.signPersonalMessage(address, data)
  }

  async decryptMessage(address: string, ciphertext: Buffer): Promise<string> {
    if (!this.isAccountUnlocked(address)) {
      throw new Error('Authentication needed')
    }
    return (await this.keychainWallet.decrypt(address, ciphertext)).toString()
  }

  hasAccount(address?: string): boolean {
    return this.keychainWallet.hasAccount(address)
  }

  getAccounts(): string[] {
    return this.keychainWallet.getAccounts()
  }

  async addAccount(privateKey: string, password: string): Promise<string> {
    return await this.keychainWallet.addAccount(privateKey, password)
  }

  async unlockAccount(address: string, password: string, duration: number): Promise<boolean> {
    return await this.keychainWallet.unlockAccount(address, password, duration)
  }

  isAccountUnlocked(address: string): boolean {
    return this.keychainWallet.isAccountUnlocked(address)
  }

  async updateAccount(address: string, oldPassword: string, newPassword: string): Promise<boolean> {
    return await this.keychainWallet.updateAccount(address, oldPassword, newPassword)
  }
  // We need this "escape hatch" from our generic interface to get the underlying KeychainWallet
  // in order to instantiate a contractkit instance. This can safely be exposed to the app at large,
  // since KeychainWallet locking/unlocking happens at the Signer level.
  getKeychainWallet(): KeychainWallet {
    return this.keychainWallet
  }
}

export default ValoraCeloWallet

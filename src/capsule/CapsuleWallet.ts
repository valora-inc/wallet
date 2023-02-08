import { CeloTx } from '@celo/connect'
import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'
import { UnlockableWallet } from '@celo/wallet-base'
import { RemoteWallet } from '@celo/wallet-remote'
import * as ethUtil from 'ethereumjs-util'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { CapsuleBaseSigner } from 'src/capsule/CapsuleSigner'
import Logger from 'src/utils/Logger'
import { SignersStorage } from './SignersStorage'
import { SessionStorage } from './SessionStorage'
import SessionManager from './SessionManager'

const TAG = 'geth/CapsuleWallet'

export abstract class CapsuleBaseWallet
  extends RemoteWallet<CapsuleBaseSigner>
  implements UnlockableWallet {
  private signersStorage = this.getSignersStorage()
  private sessionManager: SessionManager | undefined

  // ------------- Platform-specific functionalities -------------
  /**
   * Get instance of persistent storage for signers
   * @protected
   */
  protected abstract getSignersStorage(): SignersStorage
  /**
   * Get signer instance from the userId
   * @param userId
   * @param ensureSessionActive helper to use by signer if the session is expired
   * @protected
   */
  protected abstract getCapsuleSigner(
    userId: string,
    ensureSessionActive: () => Promise<void>
  ): CapsuleBaseSigner

  /**
   * Get storage instance for persisting session public key and signing messages.
   * @param userId
   * @protected
   */
  protected abstract getChallengeStorage(userId: string): SessionStorage

  /**
   * Getter for user id as we do not require its presence while creating wallet.
   * @protected
   */
  protected abstract getUserId(): Promise<string>

  // ------------- Public methods -------------

  /**
   * Send a public key to the server to allow session refreshing.
   * Requires usedId to be initialized.
   */
  public async initSessionManagement() {
    await this.initSessionManagerIfNeeded()
    await this.sessionManager!.setSessionKey()
  }

  /**
   * Add account to the wallet. Once initialized with a keyhare, the account is imported to the wallet.
   * If the keyshare is not provided, the new key account is generated and the recovery keyshare returned with a callback.
   * @param privateKey
   * @param onRecoveryKeyshare
   */
  public async addAccount(
    privateKey?: string | undefined,
    onRecoveryKeyshare?: (keyshare: string) => void
  ): Promise<string> {
    const userId = await this.getUserId()
    const signer = this.getCapsuleSigner(userId, () => this.ensureSessionActive())
    if (!privateKey) {
      Logger.info(`${TAG}@addAccount`, `Creating a new account`)
      privateKey = await signer.generateKeyshare(onRecoveryKeyshare)
      Logger.info(`${TAG}@addAccount`, privateKey)
      await signer.loadKeyshare(privateKey)
    } else {
      Logger.info(`${TAG}@addAccount`, `Adding a previously created account`)
      await signer.loadKeyshare(privateKey)
    }

    if (this.hasAccount(signer.getNativeKey())) {
      throw new Error(ErrorMessages.CAPSULE_ACCOUNT_ALREADY_EXISTS)
    }

    this.addSigner(signer.getNativeKey(), signer)
    Logger.info(`${TAG}@addAccount`, `Account added`)
    const nativeKey = signer.getNativeKey()
    await this.signersStorage.addAccount(nativeKey)
    return nativeKey
  }

  // TODO generate a session token for the wallet
  public async unlockAccount(account: string, passphrase: string, duration: number) {
    Logger.info(`${TAG}@unlockAccount`, `Unlocking ${account}`)
    return true
  }

  // TODO check session token validity
  public isAccountUnlocked(address: string) {
    return true
  }

  /**
   * Signs and sends the transaction to the network
   * @param txParams Transaction to sign
   * @dev overrides WalletBase.signTransaction
   */
  public async signTransaction(txParams: CeloTx) {
    Logger.info(`${TAG}@signTransaction`, `Signing transaction: ${JSON.stringify(txParams)}`)
    // Get the signer from the 'from' field
    const fromAddress = txParams.from!.toString()
    const signer = this.getSigner(fromAddress)
    return signer.signRawTransaction(txParams)
  }

  /**
   * Sign the provided typed data with the given address
   * @param address The address with which to sign
   * @param typedData The data to sign
   * @dev overrides WalletBase.signTypedData
   */
  public async signTypedData(address: string, typedData: EIP712TypedData): Promise<string> {
    Logger.info(
      `${TAG}@signTypedData`,
      `Signing typed DATA: ${JSON.stringify({ address, typedData })}`
    )
    const signer = this.getSigner(address)
    const { v, r, s } = await signer.signTypedData(typedData, address)
    return ethUtil.toRpcSig(v, r, s)
  }

  /**
   * Export keyshare from the wallet
   * @param address
   */
  async getKeyshare(address: string): Promise<string> {
    const keyshare = await this.getSigner(address).getKeyshare()
    if (!keyshare) {
      Logger.error(`${TAG}@addAccount`, `Missing private key`)
      throw new Error(ErrorMessages.CAPSULE_UNEXPECTED_ADDRESS)
    }
    return keyshare!
  }

  // --------------------------

  // We initialize the manager late to ensure the userID is available.
  private async initSessionManagerIfNeeded() {
    if (!this.sessionManager) {
      const userId = await this.getUserId()
      if (!userId) {
        throw Error('UserId not available during initializing session key')
      }
      this.sessionManager = new SessionManager(userId, this.getChallengeStorage(userId))
    }
  }

  private async ensureSessionActive() {
    await this.initSessionManagerIfNeeded()
    await this.sessionManager!.refreshSessionIfNeeded()
  }

  async loadAccountSigners(): Promise<Map<string, CapsuleBaseSigner>> {
    const addressToSigner = new Map<string, CapsuleBaseSigner>()
    const nativeKeys = await this.signersStorage.getAccounts()
    for (const nativeKey of nativeKeys) {
      const userId = await this.getUserId()
      const signer = this.getCapsuleSigner(userId, () => this.ensureSessionActive())
      signer.setNativeKey(nativeKey)
      addressToSigner.set(nativeKey, signer)
    }
    return addressToSigner
  }
}

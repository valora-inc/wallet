import { RLPEncodedTx, Signer } from '@celo/connect'
import { isValidAddress, normalizeAddress, normalizeAddressWith0x } from '@celo/utils/lib/address'
import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'
import { LocalSigner } from '@celo/wallet-local'
import CryptoJS from 'crypto-js'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { listStoredItems, retrieveStoredItem, storeItem } from 'src/storage/keychain'
import Logger from 'src/utils/Logger'

const TAG = 'web3/KeychainSigner'

export const ACCOUNT_STORAGE_KEY_PREFIX = 'account--'

interface KeychainAccount {
  address: string
  createdAt: Date
}

// Produces a storage key that looks like this: "account--2022-05-24T13:55:47.117Z--2d936b3ada6142b4248de1847c14fa2f4c5b63c3"
function accountStorageKey(account: KeychainAccount) {
  if (!isValidAddress(account.address)) {
    throw new Error('Expecting valid address for computing storage key')
  }
  return `${ACCOUNT_STORAGE_KEY_PREFIX}${account.createdAt.toISOString()}--${normalizeAddress(
    account.address
  )}`
}

async function encryptPrivateKey(privateKey: string, password: string) {
  return CryptoJS.AES.encrypt(privateKey, password).toString()
}

async function decryptPrivateKey(encryptedPrivateKey: string, password: string) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, password)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (e) {
    // decrypt can sometimes throw if the inputs are incorrect (encryptedPrivateKey or password)
    Logger.warn(TAG, 'Failed to decrypt private key', e)
    return null
  }
}

async function storePrivateKey(privateKey: string, account: KeychainAccount, password: string) {
  const encryptedPrivateKey = await encryptPrivateKey(privateKey, password)
  return storeItem({ key: accountStorageKey(account), value: encryptedPrivateKey })
}

async function getStoredPrivateKey(
  account: KeychainAccount,
  password: string
): Promise<string | null> {
  Logger.debug(TAG, `Checking keystore for private key for account ${account}`)
  const encryptedPrivateKey = await retrieveStoredItem(accountStorageKey(account))
  if (!encryptedPrivateKey) {
    throw new Error('No private key found in storage')
  }

  return await decryptPrivateKey(encryptedPrivateKey, password)
}

// Returns accounts that have been stored in the keychain, sorted by creation date
// The ordering is important: Geth KeyStore does this and some parts of the code base rely on it.
export async function listStoredAccounts() {
  let accounts: KeychainAccount[]
  try {
    const storedItems = await listStoredItems()
    Logger.info(`${TAG}@listStoredAccounts`, 'Keychain items:', storedItems)
    accounts = storedItems
      .filter((item) => item.startsWith(ACCOUNT_STORAGE_KEY_PREFIX))
      .map((item) => {
        const [isoDate, rawAddress] = item.slice(ACCOUNT_STORAGE_KEY_PREFIX.length).split('--')
        const address = normalizeAddressWith0x(rawAddress)
        const createdAt = new Date(isoDate)
        return {
          address,
          createdAt,
        }
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  } catch (e) {
    Logger.error(`${TAG}@listStoredAccounts`, 'Error listing accounts', e)
    throw new Error(ErrorMessages.GETH_FETCH_ACCOUNTS)
  }
  return accounts
}

/**
 * Implements the signer interface on top of the OS keychain
 */
export class KeychainSigner implements Signer {
  protected unlockedLocalSigner: LocalSigner | null = null
  // Timestamp in milliseconds when the signer was last unlocked
  protected unlockTime?: number
  // Number of seconds that the signer was last unlocked for
  protected unlockDuration?: number

  /**
   * Construct a new instance of the Keychain signer
   *
   * @param account Account address derived from the private key to be called in init
   */
  constructor(protected account: KeychainAccount) {}

  async init(privateKey: string, passphrase: string) {
    await storePrivateKey(privateKey, this.account, passphrase)
  }

  async signTransaction(
    addToV: number,
    encodedTx: RLPEncodedTx
  ): Promise<{ v: number; r: Buffer; s: Buffer }> {
    Logger.info(
      `${TAG}@signTransaction`,
      `Signing transaction: ${JSON.stringify(encodedTx.transaction)}`
    )
    const { gasPrice } = encodedTx.transaction
    if (
      gasPrice === '0x0' ||
      gasPrice === '0x' ||
      gasPrice === '0x0NaN' ||
      gasPrice === '0' ||
      !gasPrice
    ) {
      // Make sure we don't sign and send transactions with 0 gas price
      // This resulted in those TXs being stuck in the txpool for nodes running geth < v1.5.0
      throw new Error(`Preventing sign tx with 'gasPrice' set to '${gasPrice}'`)
    }

    return this.localSigner.signTransaction(addToV, encodedTx)
  }

  async signPersonalMessage(data: string): Promise<{ v: number; r: Buffer; s: Buffer }> {
    Logger.info(`${TAG}@signPersonalMessage`, `Signing ${data}`)
    return this.localSigner.signPersonalMessage(data)
  }

  async signTypedData(typedData: EIP712TypedData): Promise<{ v: number; r: Buffer; s: Buffer }> {
    Logger.info(
      `${TAG}@signTypedData`,
      `Signing typed DATA: ${JSON.stringify({ address: this.account, typedData })}`
    )
    return this.localSigner.signTypedData(typedData)
  }

  getNativeKey() {
    return this.account.address
  }

  async unlock(passphrase: string, duration: number): Promise<boolean> {
    const privateKey = await getStoredPrivateKey(this.account, passphrase)
    if (!privateKey) {
      return false
    }

    this.unlockedLocalSigner = new LocalSigner(privateKey)
    this.unlockTime = Date.now()
    this.unlockDuration = duration
    return true
  }

  isUnlocked(): boolean {
    if (this.unlockDuration === undefined || this.unlockTime === undefined) {
      return false
    }
    return this.unlockTime + this.unlockDuration * 1000 > Date.now()
  }

  /**
   * Updates the passphrase of an account
   * @param oldPassphrase - the passphrase currently associated with the account
   * @param newPassphrase - the new passphrase to use with the account
   * @returns whether the update was successful
   */
  async updatePassphrase(oldPassphrase: string, newPassphrase: string) {
    const privateKey = await getStoredPrivateKey(this.account, oldPassphrase)
    if (!privateKey) {
      return false
    }
    await storePrivateKey(privateKey, this.account, newPassphrase)
    return true
  }

  async decrypt(ciphertext: Buffer): Promise<Buffer> {
    return this.localSigner.decrypt(ciphertext)
  }

  async computeSharedSecret(publicKey: string): Promise<Buffer> {
    return this.localSigner.computeSharedSecret(publicKey)
  }

  /**
   * Get the local signer. Throws if not unlocked.
   */
  protected get localSigner(): LocalSigner {
    if (!this.isUnlocked()) {
      this.unlockedLocalSigner = null
    }
    if (!this.unlockedLocalSigner) {
      throw new Error('authentication needed: password or unlock')
    }
    return this.unlockedLocalSigner
  }
}

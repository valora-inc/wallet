import { Lock } from '@celo/base/lib/lock'
import { call, select } from 'redux-saga/effects'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getStoredMnemonic } from 'src/backup/utils'
import { DEFAULT_FORNO_URL } from 'src/config'
import Wallet from 'src/ethers/Wallet'
import { Chain } from 'src/ethers/types'
import { navigateToError } from 'src/navigator/NavigationService'
import { getPasswordSaga } from 'src/pincode/authentication'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

const wallets = new Map<Chain, Wallet | undefined>()

const initWalletLock = new Lock()

const providerUrlForChain = {
  [Chain.Celo]: DEFAULT_FORNO_URL,
}

const TAG = 'ethers/saga'

export function* initWallet(chain: Chain) {
  try {
    if (wallets.get(chain)) {
      throw new Error('Wallet already initialized')
    }
    const walletAddress: string | null = yield select(walletAddressSelector)
    if (!walletAddress) {
      throw new Error('Wallet address not initialized')
    }
    const password: string = yield call(getPasswordSaga, walletAddress, false, true)
    const mnemonic: string | null = yield call(getStoredMnemonic, walletAddress, password)
    if (!mnemonic) {
      throw new Error('failed to retrieve mnemonic')
    }
    const wallet = new Wallet(mnemonic, providerUrlForChain[chain])
    wallets.set(chain, wallet)
    Logger.info(`${TAG}@initWallet`, `Initializing ${chain} wallet ${walletAddress}`)

    yield call([wallet, wallet.init], password)
    return wallet
  } catch (error) {
    Logger.error(`${TAG}@initWallet`, 'Error initializing wallet', error)
    navigateToError(ErrorMessages.WALLET_INIT_FAILED)
  }
}

export function* getWallet(chain: Chain) {
  if (!wallets.get(chain)) {
    yield initWalletLock.acquire()
    try {
      if (wallets.get(chain)) {
        return wallets.get(chain)
      }
      yield call(initWallet, chain)
    } finally {
      initWalletLock.release()
    }
  }
  return wallets.get(chain)
}

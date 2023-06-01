import { chain } from 'lodash'
import { call, select } from 'redux-saga/effects'
import { accountCreationTimeSelector } from 'src/account/selectors'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Wallet from 'src/ethers/Wallet'
import { Chain } from 'src/ethers/types'
import { navigateToError } from 'src/navigator/NavigationService'
import Logger from 'src/utils/Logger'
import { KeychainAccount, listStoredAccounts } from 'src/web3/KeychainSigner'
import { walletAddressSelector } from 'src/web3/selectors'

let wallet: Wallet | undefined

const TAG = 'ethers/saga'

export function* initWallet() {
  try {
    if (wallet) {
      throw new Error('Wallet already initialized')
    }
    const walletAddress: string | null = yield select(walletAddressSelector)
    const accountCreationTime: number = yield select(accountCreationTimeSelector)

    // This is to migrate the existing account that used to be stored in the geth keystore
    const importMnemonicAccount = {
      address: walletAddress,
      createdAt: new Date(accountCreationTime),
    }
    const accounts: KeychainAccount[] = yield call(listStoredAccounts, importMnemonicAccount)

    const walletAccount = accounts[0]
    wallet = new Wallet(walletAccount)

    Logger.info(`${TAG}@initWallet`, `Initializing ${chain} wallet ${walletAddress}`)

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

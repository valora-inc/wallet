import { call, select } from 'redux-saga/effects'
import { Chain } from 'src/ethers/types'
import { KeychainWallet } from 'src/web3/KeychainWallet'
import { getWallet } from 'src/web3/contracts'
import { walletAddressSelector } from 'src/web3/selectors'

export function* getEthersWallet(chain: Chain) {
  const keychainWallet: KeychainWallet | undefined = yield call(getWallet)
  if (!keychainWallet) {
    throw new Error('KeychainWallet not set. Should never happen')
  }
  const walletAddress: string | null = yield select(walletAddressSelector)

  if (!walletAddress) {
    throw new Error('Wallet address not set. Should never happen')
  }

  const ethersWallet = keychainWallet.getAccount(walletAddress).unlockedEthersWallets.get(chain)

  return ethersWallet
}

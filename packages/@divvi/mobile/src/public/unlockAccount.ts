// See useWallet for why we don't directly import internal modules, except for the types
import { call, select } from 'typed-redux-saga'
import type { RunSaga } from '../redux/store'
import type { UnlockResultType as InternalUnlockResultType, UnlockAccount } from '../web3/saga'
import type { WalletAddressSelector } from '../web3/selectors'

export type UnlockResult =
  /** unlocked account successfully */
  | 'success'
  /** failure while unlocking account */
  | 'failure'
  /** user canceled */
  | 'canceled'

export async function unlockAccount(): Promise<UnlockResult> {
  const runSaga = require('../redux/store').runSaga as RunSaga
  const unlockAccount = require('../web3/saga').unlockAccount as UnlockAccount
  const InternalUnlockResult = require('../web3/saga').UnlockResult as InternalUnlockResultType
  const walletAddressSelector = require('../web3/selectors')
    .walletAddressSelector as WalletAddressSelector

  const result = await runSaga(function* () {
    const address = yield* select(walletAddressSelector)
    if (!address) {
      throw new Error('No wallet address found')
    }
    return yield* call(unlockAccount, address)
  }).catch((error) => {
    return InternalUnlockResult.FAILURE
  })

  switch (result) {
    case InternalUnlockResult.SUCCESS:
      return 'success'
    case InternalUnlockResult.FAILURE:
      return 'failure'
    case InternalUnlockResult.CANCELED:
      return 'canceled'
    default:
      const exhaustiveCheck: never = result
      return exhaustiveCheck
  }
}

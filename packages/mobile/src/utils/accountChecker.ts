import { UnlockableWallet } from '@celo/wallet-base'
import { call, select } from 'redux-saga/effects'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getWallet } from 'src/web3/contracts'
import { currentAccountSelector } from 'src/web3/selectors'

export function* checkAccountExistenceSaga() {
  const wallet: UnlockableWallet = yield call(getWallet)
  if (!wallet) {
    return
  }
  const gethAccounts: string[] = yield wallet.getAccounts()
  const reduxAddress: string = yield select(currentAccountSelector)
  if (!reduxAddress && gethAccounts.length > 0) {
    const account = gethAccounts[0]
    ValoraAnalytics.track(AppEvents.redux_keychain_mismatch, {
      account,
    })
    navigateClearingStack(Screens.StoreWipeRecoveryScreen, { account })
  }
}

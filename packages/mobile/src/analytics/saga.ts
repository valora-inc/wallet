import { call, select, spawn, take } from 'redux-saga/effects'
import { createSelector } from 'reselect'
import { nameSelector } from 'src/account/selectors'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { defaultCurrencySelector } from 'src/stableToken/selectors'
import { accountAddressSelector, currentAccountSelector } from 'src/web3/selectors'

export const getCurrentUserTraits = createSelector(
  [
    currentAccountSelector,
    accountAddressSelector,
    defaultCurrencySelector,
    nameSelector,
    userLocationDataSelector,
  ],
  (walletAddress, accountAddress, currency, name, { countryCodeAlpha2 }) => {
    return {
      accountAddress,
      walletAddress,
      currency,
      name,
      countryCodeAlpha2,
    }
  }
)

export function* updateUserTraits() {
  let prevTraits
  while (true) {
    const traits: ReturnType<typeof getCurrentUserTraits> = yield select(getCurrentUserTraits)
    if (traits !== prevTraits) {
      const { walletAddress } = traits

      yield call([ValoraAnalytics, 'setUserAddress'], walletAddress)

      // Only identify user if the wallet address is set
      if (walletAddress) {
        yield call([ValoraAnalytics, 'identify'], walletAddress, traits)
      }
      prevTraits = traits
    }

    yield take()
  }
}

export function* analyticsSaga() {
  yield spawn(updateUserTraits)
}

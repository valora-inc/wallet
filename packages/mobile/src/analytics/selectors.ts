import { createSelector } from 'reselect'
import { nameSelector } from 'src/account/selectors'
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

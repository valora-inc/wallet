import { getRegionCodeFromCountryCode } from '@celo/utils/lib/phoneNumbers'
import BigNumber from 'bignumber.js'
import DeviceInfo from 'react-native-device-info'
import { createSelector } from 'reselect'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { currentLanguageSelector } from 'src/app/reducers'
import { numberVerifiedSelector } from 'src/app/selectors'
import { backupCompletedSelector } from 'src/backup/selectors'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import {
  tokensByCurrencySelector,
  tokensByUsdBalanceSelector,
  totalTokenBalanceSelector,
} from 'src/tokens/selectors'
import { Currency } from 'src/utils/currencies'
import { accountAddressSelector, walletAddressSelector } from 'src/web3/selectors'

export const getCurrentUserTraits = createSelector(
  [
    walletAddressSelector,
    accountAddressSelector,
    defaultCountryCodeSelector,
    userLocationDataSelector,
    currentLanguageSelector,
    totalTokenBalanceSelector,
    tokensByUsdBalanceSelector,
    tokensByCurrencySelector,
    getLocalCurrencyCode,
    numberVerifiedSelector,
    backupCompletedSelector,
  ],
  (
    walletAddress,
    accountAddress,
    phoneCountryCallingCode,
    { countryCodeAlpha2 },
    language,
    totalBalanceUsd,
    tokensByUsdBalance,
    tokensByCurrency,
    localCurrencyCode,
    hasVerifiedNumber,
    hasCompletedBackup
  ) => {
    const currencyAddresses = new Set(
      Object.values(tokensByCurrency).map((token) => token?.address)
    )

    // Don't rename these unless you have a really good reason!
    // They are used in users analytics profiles + super properties
    return {
      accountAddress,
      walletAddress,
      phoneCountryCallingCode, // Example: +33
      phoneCountryCodeAlpha2: phoneCountryCallingCode
        ? getRegionCodeFromCountryCode(phoneCountryCallingCode)
        : undefined,
      countryCodeAlpha2,
      language,
      totalBalanceUsd: totalBalanceUsd?.toString(),
      tokenCount: tokensByUsdBalance.length,
      otherTenTokens: tokensByUsdBalance
        .filter((token) => !currencyAddresses.has(token.address))
        .slice(0, 10)
        .map(
          (token) =>
            // Limit balance to 5 decimals to avoid reaching the 255 chars limit
            `${token.symbol || token.address}:${new BigNumber(
              token.balance.toFixed(5, BigNumber.ROUND_DOWN)
            )}`
        )
        .join(','),
      // Maps balances
      // Example: [Celo, cUSD, cEUR] to { celoBalance: X, cusdBalance: Y, ceurBalance: Z }
      ...Object.fromEntries(
        (Object.keys(tokensByCurrency) as Currency[]).map((currency) => [
          `${currency === Currency.Celo ? 'celo' : currency.toLowerCase()}Balance`,
          tokensByCurrency[currency]?.balance,
        ])
      ),
      localCurrencyCode,
      hasVerifiedNumber,
      hasCompletedBackup,
      deviceId: DeviceInfo.getUniqueId(),
      appVersion: DeviceInfo.getVersion(),
      appBuildNumber: DeviceInfo.getBuildNumber(),
      appBundleId: DeviceInfo.getBundleId(),
    }
  }
)

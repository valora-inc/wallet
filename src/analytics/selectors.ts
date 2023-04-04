import { getRegionCodeFromCountryCode } from '@celo/phone-utils'
import BigNumber from 'bignumber.js'
import DeviceInfo from 'react-native-device-info'
import * as RNLocalize from 'react-native-localize'
import { createSelector } from 'reselect'
import { defaultCountryCodeSelector, pincodeTypeSelector } from 'src/account/selectors'
import { phoneVerificationStatusSelector } from 'src/app/selectors'
import { backupCompletedSelector } from 'src/backup/selectors'
import { superchargeInfoSelector } from 'src/consumerIncentives/selectors'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { coreTokensSelector, tokensWithTokenBalanceSelector } from 'src/tokens/selectors'
import { sortByUsdBalance } from 'src/tokens/utils'
import { mtwAddressSelector, rawWalletAddressSelector } from 'src/web3/selectors'

export const getCurrentUserTraits = createSelector(
  [
    rawWalletAddressSelector,
    mtwAddressSelector,
    defaultCountryCodeSelector,
    userLocationDataSelector,
    currentLanguageSelector,
    tokensWithTokenBalanceSelector,
    coreTokensSelector,
    getLocalCurrencyCode,
    phoneVerificationStatusSelector,
    backupCompletedSelector,
    pincodeTypeSelector,
    superchargeInfoSelector,
  ],
  (
    rawWalletAddress,
    mtwAddress,
    phoneCountryCallingCode,
    { countryCodeAlpha2 },
    language,
    tokens,
    coreTokens,
    localCurrencyCode,
    { numberVerifiedDecentralized, numberVerifiedCentralized },
    hasCompletedBackup,
    pincodeType,
    superchargeInfo
  ): // Enforce primitive types, TODO: check this using `satisfies` once we upgrade to TS >= 4.9
  // so we don't need to erase the named keys
  Record<string, string | boolean | number | null | undefined> => {
    const coreTokensAddresses = new Set(coreTokens.map((token) => token?.address))
    const tokensByUsdBalance = tokens.sort(sortByUsdBalance)

    let totalBalanceUsd = new BigNumber(0)
    for (const token of tokensByUsdBalance) {
      const tokenBalanceUsd = token.balance.multipliedBy(token.usdPrice ?? 0)
      if (!tokenBalanceUsd.isNaN()) {
        totalBalanceUsd = totalBalanceUsd.plus(tokenBalanceUsd)
      }
    }

    // Don't rename these unless you have a really good reason!
    // They are used in users analytics profiles + super properties
    return {
      accountAddress: mtwAddress ?? rawWalletAddress,
      walletAddress: rawWalletAddress?.toLowerCase(),
      phoneCountryCallingCode, // Example: +33
      phoneCountryCodeAlpha2: phoneCountryCallingCode
        ? getRegionCodeFromCountryCode(phoneCountryCallingCode)
        : undefined,
      countryCodeAlpha2,
      language,
      deviceLanguage: RNLocalize.getLocales()[0]?.languageTag, // Example: "en-GB"
      totalBalanceUsd: totalBalanceUsd?.toNumber(),
      tokenCount: tokensByUsdBalance.length,
      otherTenTokens: tokensByUsdBalance
        .filter((token) => !coreTokensAddresses.has(token.address))
        .slice(0, 10)
        .map(
          (token) =>
            // Limit balance to 5 decimals to avoid reaching the 255 chars limit
            `${token.symbol || token.address}:${new BigNumber(
              token.balance.toFixed(5, BigNumber.ROUND_DOWN)
            )}`
        )
        .join(','),
      // Map core tokens balances
      // Example: [Celo, cUSD, cEUR] to { celoBalance: X, cusdBalance: Y, ceurBalance: Z }
      ...Object.fromEntries(
        coreTokens.map((token) => [
          `${token.symbol.toLowerCase()}Balance`,
          token.balance.toNumber(),
        ])
      ),
      localCurrencyCode,
      hasVerifiedNumber: numberVerifiedDecentralized,
      hasVerifiedNumberCPV: numberVerifiedCentralized,
      hasCompletedBackup,
      deviceId: DeviceInfo.getUniqueIdSync(),
      appVersion: DeviceInfo.getVersion(),
      appBuildNumber: DeviceInfo.getBuildNumber(),
      appBundleId: DeviceInfo.getBundleId(),
      pincodeType,
      superchargingToken: superchargeInfo.superchargingTokenConfig?.tokenSymbol,
      superchargingAmountInUsd: superchargeInfo.superchargeUsdBalance,
    }
  }
)

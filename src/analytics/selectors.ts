import BigNumber from 'bignumber.js'
import { camelCase } from 'lodash'
import DeviceInfo from 'react-native-device-info'
import * as RNLocalize from 'react-native-localize'
import { createSelector } from 'reselect'
import {
  backupCompletedSelector,
  defaultCountryCodeSelector,
  pincodeTypeSelector,
} from 'src/account/selectors'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { pointsBalanceSelector } from 'src/points/selectors'
import { getPositionBalanceUsd } from 'src/positions/getPositionBalanceUsd'
import {
  hooksPreviewApiUrlSelector,
  positionsByBalanceUsdSelector,
  totalPositionsBalanceUsdSelector,
} from 'src/positions/selectors'
import { RootState } from 'src/redux/reducers'
import { tokensListSelector, tokensWithTokenBalanceSelector } from 'src/tokens/selectors'
import { sortByUsdBalance } from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import { getRegionCodeFromCountryCode } from 'src/utils/phoneNumbers'
import { rawWalletAddressSelector } from 'src/web3/selectors'

function toPascalCase(str: string) {
  const camelCaseStr = camelCase(str)
  return `${camelCaseStr.charAt(0).toUpperCase()}${camelCaseStr.slice(1)}`
}

const tokensSelector = createSelector(
  [tokensListSelector, tokensWithTokenBalanceSelector],
  (tokens, tokensWithBalance) => ({
    tokensWithBalance,
    feeTokens: tokens.filter(({ isFeeCurrency, isNative }) => isNative || isFeeCurrency),
  })
)

const positionsAnalyticsSelector = createSelector(
  [positionsByBalanceUsdSelector, totalPositionsBalanceUsdSelector, hooksPreviewApiUrlSelector],
  (positionsByUsdBalance, totalPositionsBalanceUsd, hooksPreviewApiUrl) => {
    const appsByBalanceUsd: Record<string, BigNumber> = {}
    for (const position of positionsByUsdBalance) {
      const appId = position.appId
      const positionBalanceUsd = getPositionBalanceUsd(position)
      if (appsByBalanceUsd[appId]) {
        appsByBalanceUsd[appId] = appsByBalanceUsd[appId].plus(positionBalanceUsd)
      } else {
        appsByBalanceUsd[appId] = positionBalanceUsd
      }
    }

    return {
      totalPositionsBalanceUsd: totalPositionsBalanceUsd?.toNumber() ?? 0,
      positionsCount: positionsByUsdBalance.length,
      // Example: "ubeswap-cUSD / CELO:100.00,halofi-Hold CELO:50.00"
      topTenPositions: positionsByUsdBalance
        .slice(0, 10)
        .map(
          (position) =>
            // Note: title could be localized and can contain any character
            // But is best to get a sense of what the position is (without looking up address)
            // Also truncate the title to avoid reaching the 255 chars limit
            `${position.appId}-${position.displayProps.title.slice(0, 20)}:${getPositionBalanceUsd(
              position
            ).toFixed(2)}`
        )
        .join(','),
      positionsAppsCount: new Set(positionsByUsdBalance.map((position) => position.appId)).size,
      // Example: "ubeswap:100.00,halofi:50.00"
      positionsTopTenApps: Object.entries(appsByBalanceUsd)
        .sort(([, balanceUsd1], [, balanceUsd2]) => balanceUsd2.comparedTo(balanceUsd1))
        .slice(0, 10)
        .map(([appId, balanceUsd]) => `${appId}:${balanceUsd.toFixed(2)}`)
        .join(','),
      hooksPreviewEnabled: !!hooksPreviewApiUrl,
    }
  }
)

export const getCurrentUserTraits = createSelector(
  [
    rawWalletAddressSelector,
    defaultCountryCodeSelector,
    userLocationDataSelector,
    currentLanguageSelector,
    tokensSelector,
    positionsAnalyticsSelector,
    getLocalCurrencyCode,
    phoneNumberVerifiedSelector,
    backupCompletedSelector,
    pincodeTypeSelector,
    pointsBalanceSelector,
    (_state: RootState, networkIds: NetworkId[]) => networkIds,
  ],
  (
    rawWalletAddress,
    phoneCountryCallingCode,
    { countryCodeAlpha2 },
    language,
    { tokensWithBalance, feeTokens },
    {
      totalPositionsBalanceUsd,
      positionsCount,
      topTenPositions,
      positionsAppsCount,
      positionsTopTenApps,
      hooksPreviewEnabled,
    },
    localCurrencyCode,
    numberVerifiedCentralized,
    hasCompletedBackup,
    pincodeType,
    pointsBalance,
    networkIds
  ) => {
    const feeTokenIds = new Set(feeTokens.map(({ tokenId }) => tokenId))
    const tokensByUsdBalance = tokensWithBalance.sort(sortByUsdBalance)

    let totalBalanceUsd = new BigNumber(0)
    const totalBalanceUsdByNetworkIdBigNumber: Record<string, BigNumber> = Object.fromEntries(
      networkIds.map((networkId) => [`total${toPascalCase(networkId)}BalanceUsd`, new BigNumber(0)])
    )
    for (const token of tokensByUsdBalance) {
      const tokenBalanceUsd = token.balance.multipliedBy(token.priceUsd ?? 0)
      if (!tokenBalanceUsd.isNaN()) {
        totalBalanceUsd = totalBalanceUsd.plus(tokenBalanceUsd)
        totalBalanceUsdByNetworkIdBigNumber[`total${toPascalCase(token.networkId)}BalanceUsd`] =
          totalBalanceUsdByNetworkIdBigNumber[
            `total${toPascalCase(token.networkId)}BalanceUsd`
          ].plus(tokenBalanceUsd)
      }
    }
    const totalBalanceUsdByNetworkId: Record<string, number> = {}
    for (const [key, value] of Object.entries(totalBalanceUsdByNetworkIdBigNumber)) {
      totalBalanceUsdByNetworkId[key] = value.toNumber()
    }

    const hasTokenBalanceFields: Record<string, boolean> = {
      hasTokenBalance: tokensWithBalance.length > 0,
      ...Object.fromEntries(
        networkIds.map((networkId) => [
          `has${toPascalCase(networkId)}TokenBalance`,
          tokensWithBalance.some((token) => token.networkId === networkId),
        ])
      ),
    }

    // Don't rename these unless you have a really good reason!
    // They are used in users analytics profiles + super properties
    return {
      accountAddress: rawWalletAddress,
      walletAddress: rawWalletAddress?.toLowerCase(),
      phoneCountryCallingCode, // Example: +33
      phoneCountryCodeAlpha2: phoneCountryCallingCode
        ? getRegionCodeFromCountryCode(phoneCountryCallingCode)
        : undefined,
      countryCodeAlpha2,
      language,
      deviceLanguage: RNLocalize.getLocales()[0]?.languageTag, // Example: "en-GB"
      netWorthUsd: new BigNumber(totalBalanceUsd).plus(totalPositionsBalanceUsd).toNumber(), // Tokens + positions
      totalBalanceUsd: totalBalanceUsd?.toNumber(), // Only tokens (with a USD price), no positions
      ...totalBalanceUsdByNetworkId,
      tokenCount: tokensByUsdBalance.length,
      otherTenTokens: tokensByUsdBalance
        .filter((token) => !feeTokenIds.has(token.tokenId))
        .slice(0, 10)
        .map(
          (token) =>
            // Limit balance to 5 decimals to avoid reaching the 255 chars limit
            `${token.symbol || token.address}:${new BigNumber(
              token.balance.toFixed(5, BigNumber.ROUND_DOWN)
            )}`
        )
        .join(','),
      // Map fee tokens balances
      // Example: ...{ celoBalance: X, cusdBalance: Y, ceurBalance: Z, crealBalance: W, ethBalance: B }
      ...Object.fromEntries(
        feeTokens.map((token) => [`${token.symbol.toLowerCase()}Balance`, token.balance.toNumber()])
      ),
      totalPositionsBalanceUsd,
      positionsCount,
      topTenPositions,
      positionsAppsCount,
      positionsTopTenApps,
      hooksPreviewEnabled,
      localCurrencyCode,
      hasVerifiedNumberCPV: numberVerifiedCentralized,
      hasCompletedBackup,
      deviceId: DeviceInfo.getUniqueIdSync(),
      appVersion: DeviceInfo.getVersion(),
      appBuildNumber: DeviceInfo.getBuildNumber(),
      appBundleId: DeviceInfo.getBundleId(),
      pincodeType,
      ...hasTokenBalanceFields,
      pointsBalance,
    } satisfies Record<string, string | boolean | number | null | undefined>
  }
)

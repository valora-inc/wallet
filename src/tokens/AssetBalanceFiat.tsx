import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { useSelector } from 'react-redux'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { positionsStatusSelector, totalPositionsBalanceUsdSelector } from 'src/positions/selectors'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import {
  stalePriceSelector,
  tokenFetchErrorSelector,
  tokenFetchLoadingSelector,
  totalTokenBalanceSelector,
} from 'src/tokens/selectors'

const AssetBalanceFiat = () => {
  const { t } = useTranslation()

  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const totalTokenBalanceLocal = useSelector(totalTokenBalanceSelector)
  const totalPositionsBalanceUsd = useSelector(totalPositionsBalanceUsdSelector)
  const totalPositionsBalanceLocal = useDollarsToLocalAmount(totalPositionsBalanceUsd)

  const tokenFetchLoading = useSelector(tokenFetchLoadingSelector)
  const tokenFetchError = useSelector(tokenFetchErrorSelector)
  const tokensAreStale = useSelector(stalePriceSelector)
  const positionsStatus = useSelector(positionsStatusSelector)

  const totalBalanceLocal =
    totalTokenBalanceLocal || totalPositionsBalanceLocal
      ? new BigNumber(totalTokenBalanceLocal ?? 0).plus(totalPositionsBalanceLocal ?? 0)
      : undefined

  const balance = totalBalanceLocal?.toFormat(2) ?? new BigNumber(0).toFormat(2)
  const displayedBalance =
    tokenFetchLoading ||
    tokenFetchError ||
    tokensAreStale ||
    positionsStatus === 'loading' ||
    positionsStatus === 'error'
      ? ' –'
      : balance

  return (
    <>
      <Text style={styles.label}>{t('totalAssets')}</Text>
      <Text style={styles.balanceText}>
        {localCurrencySymbol}
        {displayedBalance}
      </Text>
    </>
  )
}

const styles = StyleSheet.create({
  label: {
    ...fontStyles.regular600,
    color: Colors.gray5,
  },
  balanceText: {
    ...fontStyles.largeNumber,
  },
})

export default AssetBalanceFiat

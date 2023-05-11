import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { positionsStatusSelector, totalPositionsBalanceUsdSelector } from 'src/positions/selectors'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import {
  stalePriceSelector,
  tokenFetchErrorSelector,
  totalTokenBalanceSelector,
} from 'src/tokens/selectors'

interface Props {
  onLayout?: (event: LayoutChangeEvent) => void
}

const AssetBalanceFiat = ({ onLayout }: Props) => {
  const { t } = useTranslation()

  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const totalTokenBalanceLocal = useSelector(totalTokenBalanceSelector)
  const totalPositionsBalanceUsd = useSelector(totalPositionsBalanceUsdSelector)
  const totalPositionsBalanceLocal = useDollarsToLocalAmount(totalPositionsBalanceUsd)

  const tokenFetchError = useSelector(tokenFetchErrorSelector)
  const tokensAreStale = useSelector(stalePriceSelector)
  const positionsStatus = useSelector(positionsStatusSelector)

  const totalBalanceLocal =
    totalTokenBalanceLocal || totalPositionsBalanceLocal
      ? new BigNumber(totalTokenBalanceLocal ?? 0).plus(totalPositionsBalanceLocal ?? 0)
      : undefined

  const balance = totalBalanceLocal?.toFormat(2) ?? new BigNumber(0).toFormat(2)
  // TODO handle when fetching asset balances
  const displayedBalance =
    tokenFetchError || tokensAreStale || positionsStatus === 'error' ? ' –' : balance

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Text style={styles.label}>{t('totalAssets')}</Text>
      <Text style={styles.balanceText}>
        {localCurrencySymbol}
        {displayedBalance}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.Thick24,
  },
  label: {
    ...fontStyles.regular600,
    color: Colors.gray5,
  },
  balanceText: {
    ...fontStyles.largeNumber,
  },
})

export default AssetBalanceFiat

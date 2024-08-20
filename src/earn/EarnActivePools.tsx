import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { EarnTabType } from 'src/earn/types'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { earnPositionsSelector } from 'src/positions/selectors'
import { useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export default function EarnActivePools() {
  const { t } = useTranslation()
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)

  const pools = useSelector(earnPositionsSelector)
  const poolsSupplied = useMemo(
    () => pools.filter((pool) => new BigNumber(pool.balance).gt(0)).length,
    [pools]
  )
  const totalSuppliedValueUsd = useMemo(
    () =>
      pools.reduce(
        (acc, pool) => acc.plus(new BigNumber(pool.balance).times(new BigNumber(pool.priceUsd))),
        new BigNumber(0) ?? null
      ),
    [pools]
  )
  const totalSuppliedValue = useDollarsToLocalAmount(totalSuppliedValueUsd)
  const totalSupplied = useMemo(
    () =>
      `${localCurrencySymbol}${totalSuppliedValue ? formatValueToDisplay(totalSuppliedValue) : '--'}`,
    [localCurrencySymbol, totalSuppliedValue]
  )

  function handlePress() {
    AppAnalytics.track(EarnEvents.earn_active_pools_card_press)
    navigate(Screens.EarnHome, { activeEarnTab: EarnTabType.MyPools })
  }

  return (
    <Touchable
      style={styles.card}
      borderRadius={Spacing.Smallest8}
      testID="EarnActivePools"
      onPress={handlePress}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{t('earnFlow.activePools.title')}</Text>
        <View style={styles.textContainer}>
          <View style={styles.row} testID="EarnActivePools/TotalSupplied">
            <Text style={styles.labelText}>{t('earnFlow.activePools.depositAndEarnings')}</Text>
            <Text style={styles.valueText}>{totalSupplied}</Text>
          </View>
          <View style={styles.row} testID="EarnActivePools/PoolsSupplied">
            <Text style={styles.labelText}>{t('earnFlow.activePools.poolsSupplied')}</Text>
            <Text style={styles.valueText}>{poolsSupplied}</Text>
          </View>
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: Spacing.Smallest8,
    marginBottom: Spacing.Thick24,
  },
  title: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
  },
  labelText: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
  valueText: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.black,
  },
  container: {
    flexDirection: 'column',
    gap: Spacing.Regular16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textContainer: {
    gap: Spacing.Regular16,
  },
})

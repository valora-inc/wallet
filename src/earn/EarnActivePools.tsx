import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import Button, { BtnSizes, BtnTypes, TextSizes } from 'src/components/Button'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import { convertPositionToPool } from 'src/earn/poolHelper'
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

  const earnPositions = useSelector(earnPositionsSelector)
  const pools = useMemo(() => earnPositions.map(convertPositionToPool), [earnPositions])
  const poolsSupplied = useMemo(() => pools.filter((pool) => pool.balance.gt(0)).length, [pools])
  const totalSuppliedValue = useMemo(
    () =>
      useDollarsToLocalAmount(
        pools.reduce(
          (acc, pool) => acc.plus(pool.balance.times(pool.priceUsd)),
          new BigNumber(0)
        ) ?? null
      ),
    [pools]
  )
  const totalSupplied = useMemo(
    () =>
      `${localCurrencySymbol}${totalSuppliedValue ? formatValueToDisplay(totalSuppliedValue) : '--'}`,
    [localCurrencySymbol, totalSuppliedValue]
  )

  return (
    <View style={styles.card} testID="EarnActivePools">
      <View style={styles.container}>
        <Text style={styles.title}>{t('earnFlow.activePools.title')}</Text>
        <View>
          <View style={styles.row} testID="EarnActivePools/PoolsSupplied">
            <Text style={styles.labelText}>{t('earnFlow.activePools.poolsSupplied')}</Text>
            <Text style={styles.valueText}>{poolsSupplied}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.row} testID="EarnActivePools/TotalSupplied">
            <Text style={styles.labelText}>{t('earnFlow.activePools.totalSupplied')}</Text>
            <Text style={styles.valueText}>{totalSupplied}</Text>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            onPress={() => {
              AppAnalytics.track(EarnEvents.earn_active_pools_cta_press, {
                action: 'exploreOpenPools',
              })
              navigate(Screens.EarnHome, { activeEarnTab: EarnTabType.OpenPools })
            }}
            text={t('earnFlow.activePools.explore')}
            type={BtnTypes.TERTIARY}
            size={BtnSizes.FULL}
            style={styles.button}
            textSize={TextSizes.SMALL}
          />
          <Button
            onPress={() => {
              AppAnalytics.track(EarnEvents.earn_active_pools_cta_press, {
                action: 'myPools',
              })
              navigate(Screens.EarnHome, { activeEarnTab: EarnTabType.MyPools })
            }}
            text={t('earnFlow.activePools.myPools')}
            type={BtnTypes.SECONDARY}
            size={BtnSizes.FULL}
            style={styles.button}
            textSize={TextSizes.SMALL}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 8,
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
  separator: {
    height: 1,
    backgroundColor: Colors.gray2,
    marginVertical: Spacing.Smallest8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.Smallest8,
  },
  button: {
    flexGrow: 1,
    flexBasis: 0,
  },
  container: {
    flexDirection: 'column',
    gap: Spacing.Regular16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

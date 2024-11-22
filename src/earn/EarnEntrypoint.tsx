import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { useSelector } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { EarnTabType } from 'src/earn/types'
import { getEarnPositionBalanceValues } from 'src/earn/utils'
import { earnCardBackground } from 'src/images/Images'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { earnPositionsSelector } from 'src/positions/selectors'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export default function EarnEntrypoint() {
  const { t } = useTranslation()

  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)

  const pools = useSelector(earnPositionsSelector)
  const [hasSuppliedPools, totalSuppliedValueUsd] = useMemo(
    () => [
      pools.some((pool) => new BigNumber(pool.balance).gt(0)),
      pools.reduce(
        (acc, pool) => {
          const { poolBalanceInUsd } = getEarnPositionBalanceValues({ pool })
          return acc.plus(poolBalanceInUsd)
        },
        new BigNumber(0) ?? null
      ),
    ],
    [pools]
  )
  const totalSuppliedValue = useDollarsToLocalAmount(totalSuppliedValueUsd)
  const totalSupplied = useMemo(
    () =>
      `${localCurrencySymbol}${totalSuppliedValue ? formatValueToDisplay(totalSuppliedValue) : '--'}`,
    [localCurrencySymbol, totalSuppliedValue]
  )

  const showUKCompliantVariant = getFeatureGate(StatsigFeatureGates.SHOW_UK_COMPLIANT_VARIANT)
  if (showUKCompliantVariant) {
    return null
  }

  return (
    <View style={styles.container}>
      <Touchable
        borderRadius={8}
        style={styles.touchable}
        onPress={() => {
          AppAnalytics.track(EarnEvents.earn_entrypoint_press, {
            hasSuppliedPools,
          })
          hasSuppliedPools
            ? navigate(Screens.EarnHome, { activeEarnTab: EarnTabType.MyPools })
            : navigate(Screens.EarnInfoScreen)
        }}
        testID="EarnEntrypoint"
        shouldRenderRippleAbove
      >
        <>
          <View style={styles.row}>
            <FastImage style={styles.image} source={earnCardBackground} />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{t('earnFlow.entrypoint.title')}</Text>
              <Text style={styles.description}>
                {hasSuppliedPools
                  ? t('earnFlow.entrypoint.totalDepositAndEarnings')
                  : t('earnFlow.entrypoint.description')}
              </Text>
              {hasSuppliedPools && (
                <Text testID={'EarnEntrypoint/TotalSupplied'} style={styles.totalSupplied}>
                  {totalSupplied}
                </Text>
              )}
            </View>
          </View>
        </>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.Thick24,
  },
  touchable: {
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 8,
  },
  title: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
    marginBottom: Spacing.Smallest8,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.Smallest8,
  },
  textContainer: {
    flex: 1,
    padding: Spacing.Regular16,
  },
  description: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
  totalSupplied: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
  },
  image: {
    width: 80,
    height: '100%',
  },
})

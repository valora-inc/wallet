import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'

const TAG = 'earn/EarnActivePools'

export default function EarnActivePools() {
  const { t } = useTranslation()
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)

  // TODO(ACT-1268): use info from getEarnPositions
  const poolToken = useTokenInfo(networkConfig.aaveArbUsdcTokenId)
  const poolTokenInLocalCurrency = useDollarsToLocalAmount(poolToken?.balance ?? null)
  if (!poolToken) {
    // should never happen
    Logger.error(TAG, `No pool token found ${networkConfig.aaveArbUsdcTokenId}`)
    return null
  }
  const poolsSupplied = 1
  const totalSupplied = `${localCurrencySymbol}${poolTokenInLocalCurrency ? formatValueToDisplay(poolTokenInLocalCurrency) : '--'}`

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
              ValoraAnalytics.track(EarnEvents.earn_active_pools_cta_press, {
                action: 'exploreOpenPools',
              })
              // TODO(ACT-1260): navigate to earn home page
            }}
            text={t('earnFlow.activePools.explore')}
            type={BtnTypes.TERTIARY}
            size={BtnSizes.FULL}
            style={styles.button}
            fontStyle={typeScale.labelSemiBoldSmall}
          />
          <Button
            onPress={() => {
              ValoraAnalytics.track(EarnEvents.earn_active_pools_cta_press, {
                action: 'myPools',
              })
              // TODO(ACT-1260): navigate to earn home page
            }}
            text={t('earnFlow.activePools.myPools')}
            type={BtnTypes.SECONDARY}
            size={BtnSizes.FULL}
            style={styles.button}
            fontStyle={typeScale.labelSemiBoldSmall}
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

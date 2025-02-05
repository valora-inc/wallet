import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { getAppConfig } from 'src/appConfig'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import TokenIcon from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import { TripleBars } from 'src/earn/poolInfoScreen/SafetyCard'
import { getEarnPositionBalanceValues, getTotalYieldRate } from 'src/earn/utils'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { EarnPosition } from 'src/positions/types'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'

const BAR_HEIGHTS = [7, 11, 15]

export default function PoolCard({
  pool,
  testID = 'PoolCard',
}: {
  pool: EarnPosition
  testID?: string
}) {
  const {
    positionId,
    appId,
    appName,
    tokens,
    networkId,
    balance,
    dataProps: { earningItems, tvl, depositTokenId, safety },
  } = pool
  const { t } = useTranslation()
  const appConfig = getAppConfig()
  const allTokens = useSelector((state) => tokensByIdSelector(state, [networkId]))
  const tokensInfo = useMemo(() => {
    return tokens
      .map((token) => allTokens[token.tokenId])
      .filter((token): token is TokenBalance => !!token)
  }, [tokens, allTokens])
  const depositTokenInfo = allTokens[depositTokenId]

  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const { poolBalanceInUsd } = useMemo(() => getEarnPositionBalanceValues({ pool }), [pool])
  const poolBalanceInFiat = useDollarsToLocalAmount(poolBalanceInUsd) ?? null

  const rewardAmountInUsd = useMemo(
    () =>
      earningItems
        .reduce(
          (acc, earnItem) =>
            acc.plus(
              new BigNumber(earnItem.amount).times(
                allTokens[earnItem.tokenId]?.priceUsd ?? new BigNumber(0)
              )
            ),
          new BigNumber(0)
        )
        .toFixed(2),
    [earningItems]
  )
  const rewardAmountInFiat =
    useDollarsToLocalAmount(new BigNumber(rewardAmountInUsd)) ?? new BigNumber(0)

  const poolBalanceString = useMemo(
    () =>
      `${localCurrencySymbol}${poolBalanceInFiat ? formatValueToDisplay(poolBalanceInFiat.plus(rewardAmountInFiat)) : '--'}`,
    [localCurrencySymbol, poolBalanceInFiat, rewardAmountInFiat]
  )

  const tvlInFiat = useDollarsToLocalAmount(tvl ?? null)
  const tvlString = useMemo(() => {
    return `${localCurrencySymbol}${tvlInFiat ? formatValueToDisplay(tvlInFiat) : '--'}`
  }, [localCurrencySymbol, tvlInFiat])

  const totalYieldRate = getTotalYieldRate(pool).toFixed(2)

  const showSafetyScore = safety && appConfig.experimental?.earn?.showSafetyScoreOnPoolCard

  const onPress = () => {
    AppAnalytics.track(EarnEvents.earn_pool_card_press, {
      poolId: positionId,
      depositTokenId,
      networkId,
      poolAmount: balance,
      providerId: appId,
    })
    navigate(Screens.EarnPoolInfoScreen, { pool })
  }

  return (
    <Touchable borderRadius={12} style={styles.card} testID={testID} onPress={onPress}>
      <View style={styles.cardView}>
        <View style={styles.titleRow}>
          <View style={styles.titleRowToken}>
            {tokensInfo.map((token, index) => (
              <TokenIcon
                key={index}
                token={token}
                viewStyle={index > 0 ? { marginLeft: -8, zIndex: -index } : {}}
              />
            ))}
            <View style={styles.titleTextContainer}>
              <Text style={styles.titleTokens}>
                {tokensInfo.map((token) => token.symbol).join(' / ')}
              </Text>
              <Text style={styles.titleNetwork}>
                {t('earnFlow.poolCard.onNetwork', { networkName: NETWORK_NAMES[networkId] })}
              </Text>
            </View>
          </View>
          {showSafetyScore && (
            <View>
              <Text style={styles.safetyText}>{t('earnFlow.poolCard.safety')}</Text>
              <TripleBars safety={safety} barHeights={BAR_HEIGHTS} />
            </View>
          )}
        </View>
        <View style={styles.keyValueContainer}>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyText}>{t('earnFlow.poolCard.yieldRate')}</Text>
            <Text style={styles.valueTextBold}>
              {t('earnFlow.poolCard.percentage', {
                percentage: totalYieldRate,
              })}
            </Text>
          </View>
          <View style={styles.keyValueRow}>
            <Text style={styles.keyText}>{t('earnFlow.poolCard.tvl')}</Text>
            <Text style={styles.valueText}>{tvlString}</Text>
          </View>
        </View>
        {new BigNumber(balance).gt(0) && !!depositTokenInfo && (
          <View style={styles.withBalanceContainer}>
            <Text style={styles.keyText}>{t('earnFlow.poolCard.depositAndEarnings')}</Text>
            <Text>
              <Text style={styles.valueTextBold}>{poolBalanceString}</Text>
            </Text>
          </View>
        )}
        <Text style={styles.poweredByText}>
          {t('earnFlow.poolCard.poweredBy', { providerName: appName })}
        </Text>
      </View>
    </Touchable>
  )
}
const styles = StyleSheet.create({
  card: {
    padding: Spacing.Regular16,
    borderColor: Colors.borderSecondary,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  cardView: { gap: Spacing.Regular16 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleTextContainer: {
    marginLeft: Spacing.Smallest8,
  },
  titleTokens: {
    ...typeScale.labelSemiBoldSmall,
  },
  titleNetwork: {
    ...typeScale.bodyXSmall,
  },
  keyValueContainer: {
    gap: Spacing.Smallest8,
  },
  keyValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyText: {
    ...typeScale.bodySmall,
  },
  valueText: {
    ...typeScale.bodySmall,
  },
  valueTextBold: {
    ...typeScale.labelSemiBoldSmall,
  },
  poweredByText: {
    ...typeScale.bodyXSmall,
    alignSelf: 'center',
    color: Colors.contentSecondary,
  },
  withBalanceContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSecondary,
    paddingTop: Spacing.Regular16,
    gap: Spacing.Smallest8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleRowToken: {
    flexDirection: 'row',
  },
  safetyText: {
    ...typeScale.bodySmall,
    color: Colors.contentSecondary,
    marginBottom: Spacing.Tiny4,
  },
})

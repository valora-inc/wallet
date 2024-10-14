import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import TokenIcon from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import { useEarnPositionBalanceValues } from 'src/earn/hooks'
import { getTotalYieldRate } from 'src/earn/utils'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { EarnPosition } from 'src/positions/types'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'

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
    dataProps: { earningItems, tvl, depositTokenId },
  } = pool
  const { t } = useTranslation()
  const allTokens = useSelector((state) => tokensByIdSelector(state, [networkId]))
  const tokensInfo = useMemo(() => {
    return tokens
      .map((token) => allTokens[token.tokenId])
      .filter((token): token is TokenBalance => !!token)
  }, [tokens, allTokens])
  const depositTokenInfo = allTokens[depositTokenId]

  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const { poolBalanceInUsd } = useEarnPositionBalanceValues({ pool })
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
    borderColor: Colors.gray2,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardView: { gap: Spacing.Regular16 },
  titleRow: {
    flexDirection: 'row',
  },
  titleTextContainer: {
    marginLeft: Spacing.Smallest8,
  },
  titleTokens: {
    color: Colors.black,
    ...typeScale.labelSemiBoldSmall,
  },
  titleNetwork: {
    color: Colors.black,
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
    color: Colors.gray3,
    ...typeScale.bodySmall,
  },
  valueText: {
    color: Colors.black,
    ...typeScale.bodySmall,
  },
  valueTextBold: {
    color: Colors.black,
    ...typeScale.labelSemiBoldSmall,
  },
  poweredByText: {
    color: Colors.gray3,
    ...typeScale.bodyXSmall,
    alignSelf: 'center',
  },
  withBalanceContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray2,
    paddingTop: Spacing.Regular16,
    gap: Spacing.Smallest8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

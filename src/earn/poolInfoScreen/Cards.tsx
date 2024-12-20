import BigNumber from 'bignumber.js'
import { Duration, intervalToDuration } from 'date-fns'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { LabelWithInfo } from 'src/components/LabelWithInfo'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import { IconSize } from 'src/components/TokenIcon'
import TokenIcons from 'src/earn/poolInfoScreen/TokenIcons'
import { getEarnPositionBalanceValues } from 'src/earn/utils'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import type { EarningItem } from 'src/positions/types'
import { EarnPosition } from 'src/positions/types'
import { useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo, useTokensInfo } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import { formattedDuration } from 'src/utils/time'

function EarningItemLineItem({ earnItem }: { earnItem: EarningItem }) {
  const { t } = useTranslation()
  const tokenInfo = useTokenInfo(earnItem.tokenId)
  const amountInUsd = tokenInfo?.priceUsd?.multipliedBy(earnItem.amount)
  const localCurrencyExchangeRate = useSelector(usdToLocalCurrencyRateSelector)
  const amountInLocalCurrency = new BigNumber(localCurrencyExchangeRate ?? 0).multipliedBy(
    amountInUsd ?? 0
  )
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)

  return (
    <View testID="EarningItemLineItem" style={styles.cardLineContainer}>
      <View style={styles.flexLabel}>
        <Text numberOfLines={1} style={styles.depositAndEarningsCardLabelText}>
          {earnItem.label}
        </Text>
      </View>
      <Text style={styles.depositAndEarningsCardValueText}>
        {t('earnFlow.poolInfoScreen.lineItemAmountDisplay', {
          localCurrencySymbol,
          localCurrencyAmount: formatValueToDisplay(amountInLocalCurrency),
          cryptoAmount: formatValueToDisplay(new BigNumber(earnItem.amount)),
          cryptoSymbol: tokenInfo?.symbol,
        })}
      </Text>
    </View>
  )
}

export function DepositAndEarningsCard({
  earnPosition,
  onInfoIconPress,
}: {
  earnPosition: EarnPosition
  onInfoIconPress: () => void
}) {
  const { t } = useTranslation()
  const { balance, pricePerShare } = earnPosition
  const { earningItems, depositTokenId, cantSeparateCompoundedInterest } = earnPosition.dataProps
  const depositTokenInfo = useTokenInfo(depositTokenId)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const localCurrencyExchangeRate = useSelector(usdToLocalCurrencyRateSelector)

  const { poolBalanceInUsd: depositBalanceInUsd, poolBalanceInDepositToken } = useMemo(
    () => getEarnPositionBalanceValues({ pool: earnPosition }),
    [earnPosition]
  )
  // Deposit items used to calculate the total balance and total deposited
  const depositBalanceInLocalCurrency = new BigNumber(localCurrencyExchangeRate ?? 0).multipliedBy(
    depositBalanceInUsd ?? 0
  )

  // Earning items used to calculate the total balance and total deposited
  const earningItemsTokenIds = earningItems.map((item) => item.tokenId)
  const earningItemsTokenInfo = useTokensInfo(earningItemsTokenIds)

  const totalBalanceInLocalCurrency = useMemo(() => {
    return depositBalanceInLocalCurrency.plus(
      earningItems
        .filter((item) => !item.includedInPoolBalance)
        .reduce((acc, item) => {
          const tokenInfo = earningItemsTokenInfo.find((token) => token?.tokenId === item.tokenId)
          const amountInUsd = tokenInfo?.priceUsd?.multipliedBy(item.amount)
          const amountInLocalCurrency = new BigNumber(localCurrencyExchangeRate ?? 0).multipliedBy(
            amountInUsd ?? 0
          )
          return acc.plus(amountInLocalCurrency ?? 0)
        }, new BigNumber(0))
    )
  }, [
    depositBalanceInLocalCurrency,
    earningItems,
    earningItemsTokenInfo,
    localCurrencyExchangeRate,
  ])

  const totalDepositBalanceInCrypto = useMemo(() => {
    return poolBalanceInDepositToken.minus(
      earningItems
        .filter((item) => item.includedInPoolBalance)
        .reduce((acc, item) => {
          const tokenInfo = earningItemsTokenInfo.find((token) => token?.tokenId === item.tokenId)
          return acc.plus(
            new BigNumber(item.amount)
              .multipliedBy(tokenInfo?.priceUsd ?? 0)
              .dividedBy(depositTokenInfo?.priceUsd ?? 1)
          )
        }, new BigNumber(0))
    )
  }, [balance, pricePerShare, earningItems, earningItemsTokenInfo, depositTokenInfo])

  const totalDepositBalanceInLocalCurrency =
    useDollarsToLocalAmount(
      totalDepositBalanceInCrypto.multipliedBy(depositTokenInfo?.priceUsd ?? 0)
    ) ?? new BigNumber(0)

  return (
    <View testID="DepositAndEarningsCard" style={[styles.card, styles.depositAndEarningCard]}>
      <View style={styles.depositAndEarningCardTitleContainer}>
        <LabelWithInfo
          onPress={onInfoIconPress}
          label={t('earnFlow.poolInfoScreen.totalDepositAndEarnings')}
          labelStyle={styles.cardTitleText}
          testID={'DepositInfoIcon'}
          numberOfLines={1}
        />
        <View>
          <Text style={styles.depositAndEarningCardTitleText}>
            {t('earnFlow.poolInfoScreen.titleLocalAmountDisplay', {
              localCurrencySymbol,
              localCurrencyAmount: formatValueToDisplay(totalBalanceInLocalCurrency),
            })}
          </Text>
        </View>
      </View>

      <View style={styles.depositAndEarningCardSubtitleContainer}>
        <View style={styles.cardLineContainer}>
          <View style={styles.flexLabel}>
            {cantSeparateCompoundedInterest ? (
              <Text style={styles.depositAndEarningsCardLabelText}>
                {t('earnFlow.poolInfoScreen.depositAndEarnings')}
              </Text>
            ) : (
              <Text style={styles.depositAndEarningsCardLabelText}>
                {t('earnFlow.poolInfoScreen.deposit')}
              </Text>
            )}
          </View>
          <Text style={styles.depositAndEarningsCardValueText}>
            {t('earnFlow.poolInfoScreen.lineItemAmountDisplay', {
              localCurrencySymbol,
              localCurrencyAmount: formatValueToDisplay(totalDepositBalanceInLocalCurrency),
              cryptoAmount: formatValueToDisplay(totalDepositBalanceInCrypto),
              cryptoSymbol: depositTokenInfo?.symbol,
            })}
          </Text>
        </View>
        {earningItems.map((item, index) => (
          <EarningItemLineItem key={index} earnItem={item} />
        ))}
      </View>
    </View>
  )
}

export function YieldCard({
  onInfoIconPress,
  tokensInfo,
  earnPosition,
}: {
  onInfoIconPress: () => void
  tokensInfo: TokenBalance[]
  earnPosition: EarnPosition
}) {
  const { t } = useTranslation()
  const yieldRateSum = earnPosition.dataProps.yieldRates
    .map((rate) => rate.percentage)
    .reduce((acc, rate) => acc + rate, 0)

  return (
    <View style={styles.card} testID="YieldCard">
      <View style={styles.cardLineContainer}>
        <View style={styles.flexLabel}>
          <LabelWithInfo
            onPress={onInfoIconPress}
            label={t('earnFlow.poolInfoScreen.yieldRate')}
            labelStyle={styles.lineLabel}
            testID="YieldRateInfoIcon"
          />
        </View>
        <Text style={styles.lineValue}>
          {yieldRateSum > 0.00005
            ? t('earnFlow.poolInfoScreen.ratePercent', { rate: yieldRateSum.toFixed(2) })
            : '--'}
        </Text>
      </View>
      <View style={{ gap: Spacing.Smallest8 }}>
        {earnPosition.dataProps.yieldRates.map((rate, index) => {
          // TODO: investigate how to do when there are multiple tokens in a yield rate
          const tokenInfo = tokensInfo.filter((token) => token.tokenId === rate.tokenId)
          return (
            <View style={styles.cardLineContainer} key={index}>
              <View style={styles.flexLabel}>
                <View style={styles.yieldRateLabelContainer}>
                  <Text style={styles.cardLabelText}>{rate.label}</Text>
                  <TokenIcons
                    tokensInfo={tokenInfo}
                    size={IconSize.XXSMALL}
                    showNetworkIcon={false}
                  />
                </View>
              </View>
              <Text style={styles.cardValueText}>
                {t('earnFlow.poolInfoScreen.ratePercent', { rate: rate.percentage.toFixed(2) })}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export function DailyYieldRateCard({
  dailyYieldRate,
  onInfoIconPress,
}: {
  dailyYieldRate: number
  onInfoIconPress: () => void
}) {
  const { t } = useTranslation()
  return (
    <View style={styles.card} testID="DailyYieldRateCard">
      <View style={styles.cardLineContainer}>
        <View style={styles.flexLabel}>
          <LabelWithInfo
            onPress={onInfoIconPress}
            label={t('earnFlow.poolInfoScreen.dailyYieldRate')}
            labelStyle={styles.lineLabel}
            testID="DailyYieldRateInfoIcon"
          />
        </View>
        <Text style={styles.lineValue}>
          {t('earnFlow.poolInfoScreen.ratePercent', { rate: dailyYieldRate.toFixed(4) })}
        </Text>
      </View>
    </View>
  )
}

export function TvlCard({
  earnPosition,
  onInfoIconPress,
}: {
  earnPosition: EarnPosition
  onInfoIconPress: () => void
}) {
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const { t } = useTranslation()
  const tvl = earnPosition.dataProps.tvl
  const tvlInFiat = useDollarsToLocalAmount(tvl ?? null)
  const tvlString = useMemo(() => {
    return `${localCurrencySymbol}${tvlInFiat ? formatValueToDisplay(tvlInFiat) : '--'}`
  }, [localCurrencySymbol, tvlInFiat])

  return (
    <View style={styles.card} testID="TvlCard">
      <View style={styles.cardLineContainer}>
        <View style={styles.flexLabel}>
          <LabelWithInfo
            onPress={onInfoIconPress}
            label={t('earnFlow.poolInfoScreen.tvl')}
            labelStyle={styles.lineLabel}
            testID="TvlInfoIcon"
          />
        </View>
        <Text style={styles.lineValue}>{tvlString}</Text>
      </View>
    </View>
  )
}

export function AgeCard({
  ageOfPool,
  onInfoIconPress,
}: {
  ageOfPool: Date
  onInfoIconPress: () => void
}) {
  const { t } = useTranslation()
  const dateInterval: Duration = intervalToDuration({
    start: ageOfPool,
    end: new Date(),
  })

  return (
    <View style={styles.card} testID="AgeCard">
      <View style={styles.cardLineContainer}>
        <View style={styles.flexLabel}>
          <LabelWithInfo
            onPress={onInfoIconPress}
            label={t('earnFlow.poolInfoScreen.ageOfPool')}
            labelStyle={styles.lineLabel}
            testID="AgeInfoIcon"
          />
        </View>
        <Text style={styles.lineValue}>{formattedDuration(dateInterval)}</Text>
      </View>
    </View>
  )
}

export const styles = StyleSheet.create({
  flexLabel: {
    flex: 1.2,
  },
  card: {
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 12,
    gap: Spacing.Regular16,
  },
  cardLineContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yieldRateLabelContainer: {
    flexDirection: 'row',
    gap: Spacing.Tiny4,
  },
  lineLabel: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
    textAlign: 'left',
  },
  lineValue: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
    textAlign: 'right',
    flex: 1,
  },
  cardTitleText: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
  },
  cardLabelText: {
    ...typeScale.bodyMedium,
    color: Colors.gray3,
    textAlign: 'left',
  },
  cardValueText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    textAlign: 'right',
    flex: 1,
  },
  depositAndEarningCard: {
    backgroundColor: Colors.gray1,
    padding: 0,
    gap: 0,
  },
  depositAndEarningCardTitleContainer: {
    padding: Spacing.Regular16,
    alignItems: 'center',
    gap: Spacing.Tiny4,
  },
  depositAndEarningCardTitleText: {
    ...typeScale.titleMedium,
    color: Colors.black,
  },
  depositAndEarningCardSubtitleContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.Regular16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    gap: Spacing.Smallest8,
  },
  depositAndEarningsCardLabelText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    flexWrap: 'wrap',
    textAlign: 'left',
  },
  depositAndEarningsCardValueText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    flexWrap: 'wrap',
    textAlign: 'right',
    flex: 1,
  },
})

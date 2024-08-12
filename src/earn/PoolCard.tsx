import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import Button, { BtnSizes, BtnTypes, TextSizes } from 'src/components/Button'
import TokenDisplay, { formatValueToDisplay } from 'src/components/TokenDisplay'
import TokenIcon from 'src/components/TokenIcon'
import { Pool } from 'src/earn/types'
import { useDollarsToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'

export default function PoolCard({ pool, testID = 'PoolCard' }: { pool: Pool; testID?: string }) {
  const { tokens, networkId, poolTokenId, depositTokenId } = pool
  const { t } = useTranslation()
  const allTokens = useSelector((state) => tokensByIdSelector(state, [networkId]))
  const tokensInfo = useMemo(() => {
    return tokens
      .map((tokenId) => allTokens[tokenId])
      .filter((token): token is TokenBalance => !!token)
  }, [pool.tokens, allTokens])
  const depositTokenInfo = allTokens[depositTokenId]

  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const poolBalance = useDollarsToLocalAmount(pool.balance.times(pool.priceUsd)) ?? null
  const poolBalanceString = useMemo(
    () => `${localCurrencySymbol}${poolBalance ? formatValueToDisplay(poolBalance) : '--'}`,
    [localCurrencySymbol, poolBalance]
  )

  const rewardPercentageString = useMemo(
    () =>
      `${pool.earnItems.reduce((acc, earnItem) => acc.plus(new BigNumber(earnItem.amount)), new BigNumber(0)).toFixed(2)}%`,
    [pool.earnItems]
  )

  const totalYieldRate = new BigNumber(
    pool.yieldRates.reduce((acc, yieldRate) => acc + yieldRate.percentage, 0)
  ).toFixed(2)

  return (
    <View style={styles.card} testID={testID}>
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
          <Text style={styles.keyText}>{t('earnFlow.poolCard.rate')}</Text>
          <Text style={styles.valueTextBold}>
            {t('earnFlow.poolCard.apy', {
              apy: totalYieldRate,
            })}
          </Text>
        </View>
        <View style={styles.keyValueRow}>
          <Text style={styles.keyText}>{t('earnFlow.poolCard.reward')}</Text>
          <Text style={styles.valueText}>{rewardPercentageString}</Text>
        </View>
        <View style={styles.keyValueRow}>
          <Text style={styles.keyText}>{t('earnFlow.poolCard.tvl')}</Text>
          <Text style={styles.valueText}>{`$${new BigNumber(pool.tvl ?? 0).toFormat()}`}</Text>
        </View>
      </View>
      {pool.balance.gt(0) && !!depositTokenInfo ? (
        <View style={styles.withBalanceContainer}>
          <View style={styles.keyValueContainer}>
            <View style={styles.keyValueRow}>
              <Text style={styles.keyText}>{t('earnFlow.poolCard.deposited')}</Text>
              <Text>
                {`(`}
                <TokenDisplay
                  amount={pool.balance.times(new BigNumber(pool.pricePerShare[0]))}
                  tokenId={depositTokenId}
                  showLocalAmount={false}
                  style={styles.valueText}
                ></TokenDisplay>
                {`) `}
                <Text style={styles.valueTextBold}>{poolBalanceString}</Text>
              </Text>
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <Button
              onPress={() => {
                AppAnalytics.track(EarnEvents.earn_pool_card_cta_press, {
                  poolId: pool.poolId,
                  depositTokenId,
                  networkId: pool.networkId,
                  tokenAmount: pool.balance.toString(),
                  providerId: pool.providerId,
                  action: 'withdraw',
                })
                navigate(Screens.EarnCollectScreen, { depositTokenId, poolTokenId })
              }}
              text={t('earnFlow.poolCard.exitPool')}
              type={BtnTypes.TERTIARY}
              textSize={TextSizes.SMALL}
              size={BtnSizes.FULL}
              style={styles.button}
            />
            <Button
              onPress={() => {
                AppAnalytics.track(EarnEvents.earn_pool_card_cta_press, {
                  poolId: pool.poolId,
                  depositTokenId,
                  networkId: pool.networkId,
                  tokenAmount: pool.balance.toString(),
                  providerId: pool.providerId,
                  action: 'deposit',
                })
                navigate(Screens.EarnEnterAmount, { tokenId: depositTokenId })
              }}
              text={t('earnFlow.poolCard.addToPool')}
              type={BtnTypes.SECONDARY}
              textSize={TextSizes.SMALL}
              size={BtnSizes.FULL}
              style={styles.button}
            />
          </View>
        </View>
      ) : (
        <Button
          onPress={() => {
            AppAnalytics.track(EarnEvents.earn_pool_card_cta_press, {
              poolId: pool.poolId,
              depositTokenId,
              networkId: pool.networkId,
              tokenAmount: '0',
              providerId: pool.providerId,
              action: 'deposit',
            })
            navigate(Screens.EarnEnterAmount, { tokenId: depositTokenId })
          }}
          text={t('earnFlow.poolCard.addToPool')}
          type={BtnTypes.SECONDARY}
          textSize={TextSizes.SMALL}
          size={BtnSizes.FULL}
        />
      )}
      <Text style={styles.poweredByText}>
        {t('earnFlow.poolCard.poweredBy', { providerName: pool.provider })}
      </Text>
    </View>
  )
}
const styles = StyleSheet.create({
  card: {
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.Thick24,
    gap: Spacing.Thick24,
  },
  titleRow: {
    flexDirection: 'row',
  },
  titleTextContainer: {
    marginLeft: Spacing.Smallest8,
  },
  titleTokens: {
    color: Colors.black,
    ...typeScale.labelXSmall,
  },
  titleNetwork: {
    color: Colors.gray4,
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
    color: Colors.gray4,
    ...typeScale.bodySmall,
  },
  valueText: {
    color: Colors.black,
    ...typeScale.bodySmall,
  },
  valueTextBold: {
    color: Colors.black,
    ...typeScale.labelSemiBoldLarge,
    lineHeight: 20,
  },
  poweredByText: {
    color: Colors.gray4,
    ...typeScale.bodyXSmall,
    alignSelf: 'center',
  },
  withBalanceContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray2,
    paddingTop: Spacing.Thick24,
  },
  buttonContainer: {
    paddingTop: Spacing.Thick24,
    flexDirection: 'row',
    gap: Spacing.Smallest8,
  },
  button: {
    flexGrow: 1,
    flexBasis: 0,
  },
})

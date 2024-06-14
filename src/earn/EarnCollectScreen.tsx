import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import { PROVIDER_ID } from 'src/earn/constants'
import { useAavePoolInfo, useAaveRewardsInfoAndPrepareTransactions } from 'src/earn/hooks'
import { withdrawStatusSelector } from 'src/earn/selectors'
import { withdrawStart } from 'src/earn/slice'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'

type Props = NativeStackScreenProps<StackParamList, Screens.EarnCollectScreen>

export default function EarnCollectScreen({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { depositTokenId, poolTokenId } = route.params
  const depositToken = useTokenInfo(depositTokenId)
  const poolToken = useTokenInfo(poolTokenId)
  const withdrawStatus = useSelector(withdrawStatusSelector)

  if (!depositToken || !poolToken) {
    // should never happen
    throw new Error('Deposit / pool token not found')
  }

  const isGasSubsidized = getFeatureGate(StatsigFeatureGates.SUBSIDIZE_STABLECOIN_EARN_GAS_FEES)

  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, depositToken.networkId))
  const { asyncRewardsInfo, asyncPreparedTransactions } = useAaveRewardsInfoAndPrepareTransactions({
    poolTokenId,
    depositTokenId,
    feeCurrencies,
  })
  const onPress = () => {
    if (!asyncRewardsInfo.result || asyncPreparedTransactions.result?.type !== 'possible') {
      // should never happen because button is disabled if withdraw is not possible
      throw new Error('Cannot be called without possible prepared transactions')
    }

    const serializedRewards = asyncRewardsInfo.result.map((info) => ({
      amount: info.amount.toString(),
      tokenId: info.tokenInfo.tokenId,
    }))

    dispatch(
      withdrawStart({
        amount: poolToken.balance.toString(),
        tokenId: depositTokenId,
        preparedTransactions: getSerializablePreparedTransactions(
          asyncPreparedTransactions.result.transactions
        ),
        rewards: serializedRewards,
      })
    )

    ValoraAnalytics.track(EarnEvents.earn_collect_earnings_press, {
      depositTokenId,
      tokenAmount: poolToken.balance.toString(),
      networkId: depositToken.networkId,
      providerId: PROVIDER_ID,
      rewards: serializedRewards,
    })
  }

  // skipping apy fetch error because that isn't blocking collecting rewards
  const error = asyncRewardsInfo.error || asyncPreparedTransactions.error
  const ctaDisabled =
    asyncRewardsInfo.loading ||
    asyncRewardsInfo.error ||
    asyncPreparedTransactions.loading ||
    asyncPreparedTransactions.error ||
    asyncPreparedTransactions.result?.type !== 'possible' ||
    withdrawStatus === 'loading'

  const { maxFeeAmount, feeCurrency } = getFeeCurrencyAndAmounts(asyncPreparedTransactions.result)
  let feeSection = <GasFeeLoading />
  if (maxFeeAmount && feeCurrency) {
    feeSection = (
      <GasFee
        maxFeeAmount={maxFeeAmount}
        feeCurrency={feeCurrency}
        isGasSubsidized={isGasSubsidized}
      />
    )
  } else if (!asyncPreparedTransactions.loading) {
    feeSection = <GasFeeError />
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>{t('earnFlow.collect.title')}</Text>
        <View style={styles.collectInfoContainer}>
          <CollectItem
            title={t('earnFlow.collect.total')}
            tokenInfo={depositToken}
            rewardAmount={poolToken.balance}
          />
          {asyncRewardsInfo.loading && (
            <SkeletonPlaceholder backgroundColor={Colors.gray2} testID="EarnCollect/RewardsLoading">
              <View style={styles.rewardsLoading} />
            </SkeletonPlaceholder>
          )}
          {asyncRewardsInfo.result?.map((info, index) => (
            <CollectItem
              title={t('earnFlow.collect.plus')}
              key={index}
              tokenInfo={info.tokenInfo}
              rewardAmount={info.amount}
            />
          ))}
          <View style={styles.separator} />
          <Rate depositToken={depositToken} />
          <View>
            <Text style={styles.rateText}>{t('earnFlow.collect.fee')}</Text>
            {feeSection}
            {isGasSubsidized && (
              <Text style={styles.gasSubsidized} testID={'EarnCollect/GasSubsidized'}>
                {t('earnFlow.gasSubsidized')}
              </Text>
            )}
          </View>
        </View>
        {error && (
          <InLineNotification
            variant={NotificationVariant.Error}
            title={t('earnFlow.collect.errorTitle')}
            description={t('earnFlow.collect.errorDescription')}
            style={styles.error}
          />
        )}
        {asyncPreparedTransactions.result?.type === 'not-enough-balance-for-gas' && (
          <InLineNotification
            variant={NotificationVariant.Warning}
            title={t('earnFlow.collect.noGasTitle', { symbol: feeCurrencies[0].symbol })}
            description={t('earnFlow.collect.noGasDescription', {
              symbol: feeCurrencies[0].symbol,
              network: NETWORK_NAMES[depositToken.networkId],
            })}
            ctaLabel={t('earnFlow.collect.noGasCta', {
              symbol: feeCurrencies[0].symbol,
              network: NETWORK_NAMES[depositToken.networkId],
            })}
            onPressCta={() => {
              ValoraAnalytics.track(EarnEvents.earn_withdraw_add_gas_press, {
                gasTokenId: feeCurrencies[0].tokenId,
              })
              navigate(Screens.FiatExchangeAmount, {
                tokenId: feeCurrencies[0].tokenId,
                flow: CICOFlow.CashIn,
                tokenSymbol: feeCurrencies[0].symbol,
              })
            }}
            style={styles.error}
          />
        )}
      </ScrollView>

      <Button
        style={styles.button}
        size={BtnSizes.FULL}
        text={t('earnFlow.collect.cta')}
        onPress={onPress}
        testID="EarnCollectScreen/CTA"
        disabled={!!ctaDisabled}
        showLoading={withdrawStatus === 'loading'}
      />
    </SafeAreaView>
  )
}

function CollectItem({
  tokenInfo,
  rewardAmount,
  title,
}: {
  tokenInfo: TokenBalance
  rewardAmount: BigNumber.Value
  title: string
}) {
  return (
    <>
      <Text style={styles.collectItemTitle}>{title}</Text>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <TokenIcon token={tokenInfo} size={IconSize.MEDIUM} />
        </View>
        <View>
          <TokenDisplay
            style={styles.cryptoText}
            tokenId={tokenInfo.tokenId}
            amount={rewardAmount}
            showLocalAmount={false}
            testID={`EarnCollect/${tokenInfo.tokenId}/CryptoAmount`}
          />
          <TokenDisplay
            style={styles.fiatText}
            tokenId={tokenInfo.tokenId}
            amount={rewardAmount}
            showLocalAmount={true}
            testID={`EarnCollect/${tokenInfo.tokenId}/FiatAmount`}
          />
        </View>
      </View>
    </>
  )
}

function Rate({ depositToken }: { depositToken: TokenBalance }) {
  const { t } = useTranslation()
  const asyncPoolInfo = useAavePoolInfo({ depositTokenId: depositToken.tokenId })
  return (
    <View>
      <Text style={styles.rateText}>{t('earnFlow.collect.rate')}</Text>
      <View style={styles.row}>
        <TokenIcon token={depositToken} size={IconSize.SMALL} />
        {asyncPoolInfo.result && (
          <Text style={styles.apyText}>
            {t('earnFlow.collect.apy', {
              apy: (asyncPoolInfo.result.apy * 100).toFixed(2),
            })}
          </Text>
        )}
        {asyncPoolInfo.loading && (
          <SkeletonPlaceholder
            backgroundColor={Colors.gray2}
            highlightColor={Colors.white}
            testID="EarnCollect/ApyLoading"
          >
            <View style={styles.apyLoading} />
          </SkeletonPlaceholder>
        )}
        {asyncPoolInfo.error && (
          <Text style={styles.apyText}>{t('earnFlow.collect.apy', { apy: '--' })}</Text>
        )}
      </View>
    </View>
  )
}

function GasFeeError() {
  return (
    <View testID="EarnCollect/GasError">
      <Text style={styles.apyText}> -- </Text>
      <Text style={styles.gasFeeFiat}> -- </Text>
    </View>
  )
}

function GasFeeLoading() {
  return (
    <View testID="EarnCollect/GasLoading">
      <SkeletonPlaceholder backgroundColor={Colors.gray2} highlightColor={Colors.white}>
        <View style={styles.gasFeeCryptoLoading} />
      </SkeletonPlaceholder>
      <SkeletonPlaceholder backgroundColor={Colors.gray2} highlightColor={Colors.white}>
        <View style={styles.gasFeeFiatLoading} />
      </SkeletonPlaceholder>
    </View>
  )
}

function GasFee({
  maxFeeAmount,
  feeCurrency,
  isGasSubsidized = false,
}: {
  maxFeeAmount: BigNumber
  feeCurrency: TokenBalance
  isGasSubsidized: Boolean
}) {
  return (
    <>
      <TokenDisplay
        style={[styles.apyText, isGasSubsidized && { textDecorationLine: 'line-through' }]}
        tokenId={feeCurrency.tokenId}
        amount={maxFeeAmount}
        showLocalAmount={false}
        testID="EarnCollect/GasFeeCryptoAmount"
      />
      {!isGasSubsidized && (
        <TokenDisplay
          style={styles.gasFeeFiat}
          tokenId={feeCurrency.tokenId}
          amount={maxFeeAmount}
          showLocalAmount={true}
          testID="EarnCollect/GasFeeFiatAmount"
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: Spacing.Thick24,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    ...typeScale.titleMedium,
    marginBottom: Spacing.Thick24,
  },
  collectInfoContainer: {
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: Colors.gray1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.Smallest8,
    marginBottom: Spacing.Regular16,
  },
  cryptoText: {
    ...typeScale.labelSemiBoldLarge,
    color: Colors.black,
  },
  fiatText: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
  },
  collectItemTitle: {
    ...typeScale.labelSemiBoldXSmall,
    color: Colors.black,
    marginBottom: Spacing.Smallest8,
  },
  rewardsLoading: {
    height: 72,
    borderRadius: 16,
    marginBottom: Spacing.Regular16,
  },
  separator: {
    marginBottom: Spacing.Regular16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray2,
  },
  rateText: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
    marginBottom: Spacing.Tiny4,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apyText: {
    ...typeScale.labelSemiBoldSmall,
  },
  apyLoading: {
    width: 64,
    borderRadius: 100,
    ...typeScale.labelSemiBoldSmall,
  },
  gasFeeFiat: {
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
  },
  button: {
    padding: Spacing.Thick24,
  },
  error: {
    marginTop: Spacing.Regular16,
  },
  gasFeeCryptoLoading: {
    width: 80,
    borderRadius: 100,
    ...typeScale.labelSemiBoldSmall,
  },
  gasFeeFiatLoading: {
    width: 64,
    borderRadius: 100,
    ...typeScale.bodyXSmall,
  },
  gasSubsidized: {
    ...typeScale.labelXSmall,
    color: Colors.primary,
    marginTop: Spacing.Tiny4,
  },
})

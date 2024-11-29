import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import Button, { BtnSizes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import { usePrepareEarnConfirmationScreenTransactions } from 'src/earn/hooks'
import { withdrawStatusSelector } from 'src/earn/selectors'
import { withdrawStart } from 'src/earn/slice'
import { EarnActiveMode } from 'src/earn/types'
import { getEarnPositionBalanceValues, isGasSubsidizedForNetwork } from 'src/earn/utils'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { hooksApiUrlSelector, positionsWithBalanceSelector } from 'src/positions/selectors'
import { Token } from 'src/positions/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import { walletAddressSelector } from 'src/web3/selectors'
import { isAddress } from 'viem'

type Props = NativeStackScreenProps<StackParamList, Screens.EarnConfirmationScreen>

export default function EarnConfirmationScreen({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { pool, mode, inputAmount, useMax } = route.params
  const { depositTokenId, withdrawTokenId, rewardsPositionIds } = pool.dataProps
  const withdrawStatus = useSelector(withdrawStatusSelector)
  const rewardsPositions = useSelector(positionsWithBalanceSelector).filter((position) =>
    rewardsPositionIds?.includes(position.positionId)
  )

  const hooksApiUrl = useSelector(hooksApiUrlSelector)
  const walletAddress = useSelector(walletAddressSelector)
  const depositToken = useTokenInfo(depositTokenId)
  const withdrawToken = useTokenInfo(withdrawTokenId)

  const rewardsTokens = useMemo(
    () => rewardsPositions.flatMap((position) => position.tokens),
    [rewardsPositions]
  )

  if (!depositToken || !withdrawToken) {
    // should never happen
    throw new Error('Deposit token or withdraw token not found')
  }
  if (!walletAddress || !isAddress(walletAddress)) {
    // should never happen
    throw new Error('Wallet address is not valid')
  }

  const isGasSubsidized = isGasSubsidizedForNetwork(depositToken.networkId)

  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, depositToken.networkId))

  const withdrawAmountInDepositToken = useMemo(
    () =>
      inputAmount
        ? new BigNumber(inputAmount)
        : getEarnPositionBalanceValues({ pool }).poolBalanceInDepositToken,
    [withdrawToken, pool.pricePerShare, inputAmount]
  )

  const {
    result: prepareTransactionsResult,
    loading: isPreparingTransactions,
    error: prepareTransactionError,
  } = usePrepareEarnConfirmationScreenTransactions(mode, {
    amount: withdrawAmountInDepositToken.dividedBy(pool.pricePerShare[0]).toString(),
    pool,
    walletAddress,
    feeCurrencies,
    hooksApiUrl,
    rewardsPositions,
    useMax,
  })

  const onPress = () => {
    if (prepareTransactionsResult?.type !== 'possible') {
      // should never happen because button is disabled if withdraw is not possible
      throw new Error('Cannot be called without possible prepared transactions')
    }

    dispatch(
      withdrawStart({
        preparedTransactions: getSerializablePreparedTransactions(
          prepareTransactionsResult.transactions
        ),
        rewardsTokens,
        pool,
        mode,
        ...(mode !== 'claim-rewards' && { amount: withdrawAmountInDepositToken.toString() }),
      })
    )

    AppAnalytics.track(EarnEvents.earn_collect_earnings_press, {
      depositTokenId,
      tokenAmount: withdrawAmountInDepositToken.toString(),
      networkId: withdrawToken.networkId,
      providerId: pool.appId,
      poolId: pool.positionId,
      rewards: rewardsTokens.map((token) => ({
        amount: token.balance.toString(),
        tokenId: token.tokenId,
      })),
      mode,
    })
  }

  const error = prepareTransactionError
  const ctaDisabled =
    isPreparingTransactions ||
    error ||
    prepareTransactionsResult?.type !== 'possible' ||
    withdrawStatus === 'loading'

  const { maxFeeAmount, feeCurrency } = getFeeCurrencyAndAmounts(prepareTransactionsResult)

  let feeSection = <GasFeeLoading />
  if (maxFeeAmount && feeCurrency) {
    feeSection = (
      <GasFee
        maxFeeAmount={maxFeeAmount}
        feeCurrency={feeCurrency}
        isGasSubsidized={isGasSubsidized}
      />
    )
  } else if (!isPreparingTransactions) {
    feeSection = <GasFeeError />
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Title mode={mode} />
        <View style={styles.collectInfoContainer}>
          {mode !== 'claim-rewards' && (
            <CollectItem
              title={t('earnFlow.collect.total')}
              tokenInfo={depositToken}
              rewardAmount={withdrawAmountInDepositToken}
            />
          )}
          {(mode !== 'withdraw' || pool.dataProps.withdrawalIncludesClaim) &&
            rewardsTokens.map((token, index) => (
              <CollectItem
                title={t('earnFlow.collect.reward')}
                key={index}
                tokenInfo={token}
                rewardAmount={token.balance}
              />
            ))}
          <View style={styles.separator} />
          <View>
            <Text style={styles.rateText}>{t('earnFlow.collect.fee')}</Text>
            {feeSection}
            {isGasSubsidized && (
              <Text style={styles.gasSubsidized} testID={'EarnConfirmation/GasSubsidized'}>
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
        {prepareTransactionsResult?.type === 'not-enough-balance-for-gas' && (
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
              AppAnalytics.track(EarnEvents.earn_withdraw_add_gas_press, {
                gasTokenId: feeCurrencies[0].tokenId,
                depositTokenId: pool.dataProps.depositTokenId,
                networkId: pool.networkId,
                providerId: pool.appId,
                poolId: pool.positionId,
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
        text={
          mode === 'withdraw'
            ? t('earnFlow.collect.ctaWithdraw')
            : mode === 'exit'
              ? t('earnFlow.collect.ctaExit')
              : t('earnFlow.collect.ctaReward')
        }
        onPress={onPress}
        testID="EarnConfirmationScreen/CTA"
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
  tokenInfo: TokenBalance | Token
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
            testID={`EarnConfirmation/${tokenInfo.tokenId}/CryptoAmount`}
          />
          <TokenDisplay
            style={styles.fiatText}
            tokenId={tokenInfo.tokenId}
            amount={rewardAmount}
            showLocalAmount={true}
            testID={`EarnConfirmation/${tokenInfo.tokenId}/FiatAmount`}
          />
        </View>
      </View>
    </>
  )
}

function GasFeeError() {
  return (
    <View testID="EarnConfirmation/GasError">
      <Text style={styles.apyText}> -- </Text>
      <Text style={styles.gasFeeFiat}> -- </Text>
    </View>
  )
}

function GasFeeLoading() {
  return (
    <View testID="EarnConfirmation/GasLoading">
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
        testID="EarnConfirmation/GasFeeCryptoAmount"
      />
      {!isGasSubsidized && (
        <TokenDisplay
          style={styles.gasFeeFiat}
          tokenId={feeCurrency.tokenId}
          amount={maxFeeAmount}
          showLocalAmount={true}
          testID="EarnConfirmation/GasFeeFiatAmount"
        />
      )}
    </>
  )
}

function Title({ mode }: { mode: Exclude<EarnActiveMode, 'deposit' | 'swap-deposit'> }) {
  const { t } = useTranslation()
  switch (mode) {
    case 'claim-rewards':
      return <Text style={styles.title}>{t('earnFlow.collect.titleClaim')}</Text>
    case 'withdraw':
      return <Text style={styles.title}>{t('earnFlow.collect.titleWithdraw')}</Text>
    case 'exit':
    default:
      return <Text style={styles.title}>{t('earnFlow.collect.titleCollect')}</Text>
  }
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
    color: Colors.accent,
    marginTop: Spacing.Tiny4,
  },
})

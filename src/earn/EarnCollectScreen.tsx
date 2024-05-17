import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'
import Button, { BtnSizes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import { useAavePoolInfo, useAaveRewardsInfo } from 'src/earn/hooks'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'

type Props = NativeStackScreenProps<StackParamList, Screens.EarnCollectScreen>

export default function EarnCollectScreen({ route }: Props) {
  const { t } = useTranslation()
  const { depositTokenId, poolTokenId } = route.params
  const depositToken = useTokenInfo(depositTokenId)
  const poolToken = useTokenInfo(poolTokenId)

  if (!depositToken || !poolToken) {
    // should never happen
    throw new Error('Deposit / pool token not found')
  }

  const asyncRewardsInfo = useAaveRewardsInfo({ poolTokenId })

  // TODO(ACT-1180): prepare a tx and handle these
  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, depositToken.networkId))
  const maxFeeAmount = new BigNumber(0.0001)
  const onPress = () => {
    // Todo handle prepared transactions
  }

  // skipping apy fetch error because that isn't blocking collecting rewards
  const error = asyncRewardsInfo.error
  const ctaDisabled = asyncRewardsInfo.loading || asyncRewardsInfo.error

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
          <GasFee maxFeeAmount={maxFeeAmount} feeCurrency={feeCurrencies[0]} />
        </View>
        {error && (
          <InLineNotification
            variant={NotificationVariant.Error}
            title={t('earnFlow.collect.errorTitle')}
            description={t('earnFlow.collect.errorDescription')}
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

function GasFee({
  maxFeeAmount,
  feeCurrency,
}: {
  maxFeeAmount: BigNumber
  feeCurrency: TokenBalance
}) {
  const { t } = useTranslation()

  return (
    <View>
      <Text style={styles.rateText}>{t('earnFlow.collect.fee')}</Text>
      <TokenDisplay
        style={styles.apyText}
        tokenId={feeCurrency.tokenId}
        amount={maxFeeAmount}
        showLocalAmount={false}
      />
      <TokenDisplay
        style={styles.gasFeeFiat}
        tokenId={feeCurrency.tokenId}
        amount={maxFeeAmount}
        showLocalAmount={true}
      />
    </View>
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
})

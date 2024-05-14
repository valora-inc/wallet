import React from 'react'

import BigNumber from 'bignumber.js'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import Button, { BtnSizes } from 'src/components/Button'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'

export default function EarnCollectScreen() {
  // TODO: replace with actual token info, pool info, rewards info, pool apy, max fee amount, fee currency

  const tokenInfo = useTokenInfo(networkConfig.arbUsdcTokenId)
  const poolTokenInfo = useTokenInfo(networkConfig.aaveArbUsdcTokenId)
  const rewardTokenInfo = useTokenInfo(`${NetworkId['arbitrum-sepolia']}:native`)
  const feeCurrency = useTokenInfo(`${NetworkId['arbitrum-sepolia']}:native`)
  if (!tokenInfo || !rewardTokenInfo || !feeCurrency || !poolTokenInfo) {
    return null
  }

  const dummyRewardsInfo = [{ amount: new BigNumber(0.00003), tokenInfo: rewardTokenInfo }]
  const poolApy = 3.47
  const maxFeeAmount = new BigNumber(0.0001)
  const onPress = () => {
    // Todo handle prepared transactions
  }

  // TODO: Add loading state
  return (
    <EarnCollectComponent
      tokenInfo={tokenInfo}
      poolTokenInfo={poolTokenInfo}
      rewardsInfo={dummyRewardsInfo}
      poolApy={poolApy}
      maxFeeAmount={maxFeeAmount}
      feeCurrency={feeCurrency}
      onPress={onPress}
    />
  )
}

function EarnCollectComponent({
  tokenInfo,
  poolTokenInfo,
  poolApy,
  rewardsInfo,
  maxFeeAmount,
  feeCurrency,
  onPress,
}: {
  tokenInfo: TokenBalance
  poolTokenInfo: TokenBalance
  poolApy: number
  maxFeeAmount: BigNumber
  feeCurrency: TokenBalance
  onPress: () => void
  rewardsInfo: { amount: BigNumber; tokenInfo: TokenBalance }[]
}) {
  const { t } = useTranslation()
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>{t('earnFlow.collect.title')}</Text>
        <View style={styles.collectInfoContainer}>
          <CollectItem
            title={t('earnFlow.collect.total')}
            tokenInfo={tokenInfo}
            rewardAmount={poolTokenInfo.balance}
          />
          {rewardsInfo.map((info, index) => (
            <CollectItem
              title={t('earnFlow.collect.plus')}
              key={index}
              tokenInfo={info.tokenInfo}
              rewardAmount={info.amount}
            />
          ))}
          <View style={styles.separator} />
          <Rate tokenInfo={poolTokenInfo} poolApy={poolApy} />
          <GasFee maxFeeAmount={maxFeeAmount} feeCurrency={feeCurrency} />
        </View>
      </ScrollView>
      <Button
        style={styles.button}
        size={BtnSizes.FULL}
        text={t('earnFlow.collect.cta')}
        onPress={onPress}
        testID="EarnCollectScreen/CTA"
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
  rewardAmount: BigNumber
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
          />
          <TokenDisplay
            style={styles.fiatText}
            tokenId={tokenInfo.tokenId}
            amount={rewardAmount}
            showLocalAmount={true}
          />
        </View>
      </View>
    </>
  )
}

function Rate({ tokenInfo, poolApy }: { tokenInfo: TokenBalance; poolApy: number }) {
  const { t } = useTranslation()
  return (
    <View>
      <Text style={styles.rateText}>{t('earnFlow.collect.rate')}</Text>
      <View style={styles.row}>
        <TokenIcon token={tokenInfo} size={IconSize.SMALL} />
        <View style={styles.apyContainer}>
          <Text style={styles.apyText}>
            {t('earnFlow.activePools.apy', {
              apy: poolApy,
            })}
          </Text>
        </View>
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
  separator: {
    marginBottom: Spacing.Regular16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray2,
  },
  apyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateText: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
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
})

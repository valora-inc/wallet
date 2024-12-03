import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import RowDivider from 'src/components/RowDivider'
import TokenDisplay from 'src/components/TokenDisplay'
import { useEarnPositionProviderName } from 'src/earn/hooks'
import ArrowRightThick from 'src/icons/ArrowRightThick'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import FeeRowItem from 'src/transactions/feed/detailContent/FeeRowItem'
import {
  EarnClaimReward,
  EarnDeposit,
  EarnSwapDeposit,
  EarnWithdraw,
  FeeType,
  TokenTransactionTypeV2,
} from 'src/transactions/types'

interface EarnClaimRewardProps {
  transaction: EarnClaimReward
}

export function EarnClaimContent({ transaction }: EarnClaimRewardProps) {
  const { t } = useTranslation()
  const providerName = useEarnPositionProviderName(transaction.providerId)
  const tokenInfo = useTokenInfo(transaction.amount.tokenId)
  const tokenSymbol = tokenInfo?.symbol ?? ''

  return (
    <>
      <Text style={styles.detailsTitle}>{t('earnFlow.transactionDetails.descriptionLabel')}</Text>
      {!!providerName && (
        <Text style={styles.detailsSubtitle}>
          {t('earnFlow.transactionDetails.earnClaimSubtitle', { providerName, tokenSymbol })}
        </Text>
      )}
      <RowDivider />
      <View>
        <View style={styles.row}>
          <Text style={styles.amountTitle} testID={'EarnFeedItem/title'}>
            {t('earnFlow.transactionDetails.earnClaimDetails')}
          </Text>
          <TokenDisplay
            amount={transaction.amount.value}
            tokenId={transaction.amount.tokenId}
            showSymbol={true}
            showLocalAmount={false}
            style={styles.amountTitle}
          />
        </View>
        <TokenDisplay
          amount={transaction.amount.value}
          tokenId={transaction.amount.tokenId}
          style={styles.amountSubtitle}
        />
      </View>
      <RowDivider />
      <FeeRowItem
        fees={transaction.fees}
        feeType={FeeType.SecurityFee}
        transactionStatus={transaction.status}
      />
    </>
  )
}

interface EarnDepositProps {
  transaction: EarnDeposit | EarnSwapDeposit
}

export function EarnDepositContent({ transaction }: EarnDepositProps) {
  const { t } = useTranslation()
  const providerName = useEarnPositionProviderName(
    transaction.type === TokenTransactionTypeV2.EarnSwapDeposit
      ? transaction.deposit.providerId
      : transaction.providerId
  )
  const depositAmount =
    transaction.type === TokenTransactionTypeV2.EarnDeposit
      ? transaction.outAmount
      : transaction.deposit.outAmount
  const depositTokenInfo = useTokenInfo(depositAmount.tokenId)
  const depositTokenSymbol = depositTokenInfo?.symbol ?? ''

  return (
    <>
      <Text style={styles.detailsTitle}>{t('earnFlow.transactionDetails.descriptionLabel')}</Text>
      {!!providerName && (
        <Text style={styles.detailsSubtitle}>
          {t('earnFlow.transactionDetails.earnDepositSubtitle', {
            providerName,
            tokenSymbol: depositTokenSymbol,
          })}
        </Text>
      )}
      <RowDivider />
      <View style={styles.amountContainer}>
        <View>
          <View style={styles.row}>
            <Text style={styles.amountTitle} testID={'EarnDepositDetails/title'}>
              {t('earnFlow.transactionDetails.earnDepositDetails')}
            </Text>
            <TokenDisplay
              amount={depositAmount.value}
              tokenId={depositAmount.tokenId}
              showSymbol={true}
              showLocalAmount={false}
              style={styles.amountTitle}
            />
          </View>
          <TokenDisplay
            amount={depositAmount.value}
            tokenId={depositAmount.tokenId}
            style={styles.amountSubtitle}
          />
        </View>
        {transaction.type === TokenTransactionTypeV2.EarnSwapDeposit && (
          <View style={styles.row}>
            <Text style={styles.bodyText}>{t('earnFlow.transactionDetails.swap')}</Text>
            <View style={styles.swapValueContainer}>
              <TokenDisplay
                testID="EarnSwapDeposit/Swap/From"
                tokenId={transaction.swap.outAmount.tokenId}
                amount={transaction.swap.outAmount.value}
                showLocalAmount={false}
                style={styles.bodyText}
              />
              <ArrowRightThick size={20} color={Colors.black} />
              <TokenDisplay
                testID="EarnSwapDeposit/Swap/To"
                tokenId={depositAmount.tokenId}
                amount={depositAmount.value}
                showLocalAmount={false}
                style={styles.bodyText}
              />
            </View>
          </View>
        )}
        {transaction.type === TokenTransactionTypeV2.EarnSwapDeposit && (
          <View style={styles.row}>
            <Text style={styles.bodyText}>{t('earnFlow.transactionDetails.network')}</Text>
            <Text style={styles.bodyTextValue}>{NETWORK_NAMES[transaction.networkId]}</Text>
          </View>
        )}
      </View>
      <RowDivider />
      <Text style={styles.detailsTitle}>{t('earnFlow.transactionDetails.fees')}</Text>
      <View style={styles.feeContainer}>
        <FeeRowItem
          fees={transaction.fees}
          feeType={FeeType.SecurityFee}
          transactionStatus={transaction.status}
        />
        {transaction.type === TokenTransactionTypeV2.EarnSwapDeposit && (
          <FeeRowItem
            fees={transaction.fees}
            feeType={FeeType.AppFee}
            transactionStatus={transaction.status}
          />
        )}
      </View>
    </>
  )
}

interface EarnWithdrawProps {
  transaction: EarnWithdraw
}

export function EarnWithdrawContent({ transaction }: EarnWithdrawProps) {
  const { t } = useTranslation()
  const providerName = useEarnPositionProviderName(transaction.providerId)
  const tokenInfo = useTokenInfo(transaction.inAmount.tokenId)
  const tokenSymbol = tokenInfo?.symbol ?? ''

  return (
    <>
      <Text style={styles.detailsTitle}>{t('earnFlow.transactionDetails.descriptionLabel')}</Text>
      {!!providerName && (
        <Text style={styles.detailsSubtitle}>
          {t('earnFlow.transactionDetails.earnWithdrawSubtitle', { providerName, tokenSymbol })}
        </Text>
      )}
      <RowDivider />
      <View>
        <View style={styles.row}>
          <Text style={styles.amountTitle} testID={'EarnWithdrawDetails/title'}>
            {t('earnFlow.transactionDetails.earnWithdrawDetails')}
          </Text>
          <TokenDisplay
            amount={transaction.inAmount.value}
            tokenId={transaction.inAmount.tokenId}
            showSymbol={true}
            showLocalAmount={false}
            style={styles.amountTitle}
          />
        </View>
        <TokenDisplay
          amount={transaction.inAmount.value}
          tokenId={transaction.inAmount.tokenId}
          style={styles.amountSubtitle}
        />
      </View>
      <RowDivider />
      <FeeRowItem
        fees={transaction.fees}
        feeType={FeeType.SecurityFee}
        transactionStatus={transaction.status}
      />
    </>
  )
}

const styles = StyleSheet.create({
  detailsTitle: {
    ...typeScale.labelSmall,
    color: Colors.black,
  },
  detailsSubtitle: {
    ...typeScale.bodyMedium,
    color: Colors.black,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  bodyText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
  },
  bodyTextValue: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    textAlign: 'right',
  },
  amountTitle: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
  },
  amountSubtitle: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
    marginLeft: 'auto',
  },
  amountContainer: {
    gap: Spacing.Regular16,
  },
  feeContainer: {
    marginTop: Spacing.Smallest8,
    gap: Spacing.Regular16,
  },
  swapValueContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.Tiny4,
    alignItems: 'center',
  },
})

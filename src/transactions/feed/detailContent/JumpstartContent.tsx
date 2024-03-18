import BigNumber from 'bignumber.js'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import Button from 'src/components/Button'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import NetworkFeeRowItem from 'src/transactions/feed/detailContent/NetworkFeeRowItem'
import { TokenTransactionTypeV2, TokenTransfer } from 'src/transactions/types'
import Logger from 'src/utils/Logger'

const TAG = 'JumpstartContent'

function JumpstartContent({ transfer }: { transfer: TokenTransfer }) {
  const { t } = useTranslation()
  const transferTokenInfo = useTokenInfo(transfer.amount.tokenId)

  const parsedAmount = new BigNumber(transfer.amount.value).abs()
  const token = useTokenInfo(transfer.amount.tokenId)
  const isDeposit = transfer.type === TokenTransactionTypeV2.Sent

  if (!token) {
    // should never happen
    Logger.error(TAG, 'Token is undefined')
    return null
  }

  // TODO: Add reclaim button
  const reclaimButton = !isDeposit ? undefined : (
    <Button onPress={() => console.log('pressed')} text="Press" />
  )

  return (
    <>
      <View style={styles.amountContainer}>
        <View style={styles.amountTextContainer}>
          <TokenDisplay
            style={styles.sendAmount}
            amount={parsedAmount}
            tokenId={token.tokenId}
            showLocalAmount={false}
          />
          <TokenDisplay
            style={styles.sendAmountLocalCurrency}
            amount={parsedAmount}
            tokenId={token.tokenId}
            showLocalAmount
          />
        </View>
        <TokenIcon token={token} size={IconSize.LARGE} />
      </View>
      {reclaimButton}
      <NetworkFeeRowItem fees={transfer.fees} transactionStatus={transfer.status} />
      <LineItemRow
        title={t('amountSent')}
        textStyle={typeScale.labelSemiBoldMedium}
        style={styles.amountSentContainer}
        amount={
          <TokenDisplay
            amount={transfer.amount.value}
            tokenId={transfer.amount.tokenId}
            showLocalAmount={false}
            hideSign={true}
            testID="TransferSent/AmountSentValue"
          />
        }
      />
      <LineItemRow
        title={
          <Trans
            i18nKey={'tokenExchangeRateApprox'}
            tOptions={{ symbol: transferTokenInfo?.symbol }}
          >
            <TokenDisplay
              amount={new BigNumber(1)}
              tokenId={transfer.amount.tokenId}
              showLocalAmount={true}
              testID="TransferSent/TransferTokenExchangeRate"
            />
          </Trans>
        }
        amount={
          <TokenDisplay
            amount={-transfer.amount.value}
            tokenId={transfer.amount.tokenId}
            showLocalAmount={true}
            hideSign={true}
            testID="TransferSent/AmountSentValueFiat"
          />
        }
        style={styles.tokenFiatValueContainer}
        textStyle={styles.tokenFiatValueText}
      />
    </>
  )
}

const styles = StyleSheet.create({
  amountSentContainer: {
    marginTop: Spacing.Small12,
  },
  tokenFiatValueContainer: {
    marginTop: -Spacing.Tiny4,
  },
  tokenFiatValueText: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
  },

  container: {
    padding: Spacing.Thick24,
  },
  heading: {
    ...typeScale.titleSmall,
    marginBottom: Spacing.Thick24,
  },
  amountContainer: {
    backgroundColor: Colors.gray1,
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: 16,
    padding: Spacing.Regular16,
    gap: Spacing.Regular16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.Thick24,
  },
  amountTextContainer: {
    flex: 1,
  },
  sendAmountLabel: {
    ...typeScale.labelSmall,
    marginBottom: Spacing.Smallest8,
  },
  sendAmount: {
    ...typeScale.titleLarge,
    marginBottom: Spacing.Tiny4,
  },
  sendAmountLocalCurrency: {
    ...typeScale.labelMedium,
  },
  button: {
    marginBottom: Spacing.Large32,
  },
})

export default JumpstartContent

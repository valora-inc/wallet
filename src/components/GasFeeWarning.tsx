import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import { Spacing } from 'src/styles/styles'
import { PreparedTransactionsResult } from 'src/viem/prepareTransactions'

enum GasFeeWarningFlow {
  Send = 'Send',
  Swap = 'Swap',
  Deposit = 'Deposit',
  Withdraw = 'Withdraw',
  Dapp = 'Dapp',
}

function GasFeeWarning({
  prepareTransactionsResult,
  flow,
  onPressCta,
}: {
  prepareTransactionsResult: PreparedTransactionsResult
  flow: GasFeeWarningFlow
  onPressCta?: () => void
}) {
  const { t } = useTranslation()

  if (prepareTransactionsResult.type === 'possible') {
    return null
  }

  // TODO: Track analytics event here

  const feeCurrencySymbol =
    prepareTransactionsResult.type === 'not-enough-balance-for-gas'
      ? prepareTransactionsResult.feeCurrencies[0].symbol
      : prepareTransactionsResult.feeCurrency.symbol
  return (
    <InLineNotification
      variant={NotificationVariant.Warning}
      title={
        flow === GasFeeWarningFlow.Dapp
          ? t('gasFeeWarning.titleDapp')
          : t('gasFeeWarning.title', { feeTokenSymbol: feeCurrencySymbol })
      }
      description={}
      ctaLabel={}
      onPressCta={onPressCta}
      style={styles.warning}
      testID="EarnEnterAmount/NotEnoughForGasWarning"
    />
  )
}

const styles = StyleSheet.create({
  warning: {
    marginTop: Spacing.Regular16,
    paddingHorizontal: Spacing.Regular16,
    borderRadius: 16,
  },
})

export default GasFeeWarning

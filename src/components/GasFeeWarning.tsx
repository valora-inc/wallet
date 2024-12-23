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

  const flowToActionString = {
    [GasFeeWarningFlow.Send]: t('gasFeeWarning.actions.sending'),
    [GasFeeWarningFlow.Swap]: t('gasFeeWarning.actions.swapping'),
    [GasFeeWarningFlow.Deposit]: t('gasFeeWarning.actions.depositing'),
    [GasFeeWarningFlow.Withdraw]: t('gasFeeWarning.actions.withdrawing'),
    [GasFeeWarningFlow.Dapp]: undefined,
  }

  const flowToVerbString = {
    [GasFeeWarningFlow.Send]: t('gasFeeWarning.verb.send'),
    [GasFeeWarningFlow.Swap]: t('gasFeeWarning.verb.swap'),
    [GasFeeWarningFlow.Deposit]: t('gasFeeWarning.verb.deposit'),
    [GasFeeWarningFlow.Withdraw]: t('gasFeeWarning.verb.withdraw'),
    [GasFeeWarningFlow.Dapp]: undefined,
  }

  if (prepareTransactionsResult.type === 'possible') {
    return null
  }

  // TODO: Track analytics event here

  const feeCurrencySymbol =
    prepareTransactionsResult.type === 'not-enough-balance-for-gas'
      ? prepareTransactionsResult.feeCurrencies[0].symbol
      : prepareTransactionsResult.feeCurrency.symbol

  const amountToAdd = flow === GasFeeWarningFlow.Dapp ? 0 : undefined // TODO: Get amount here

  const title =
    flow === GasFeeWarningFlow.Dapp
      ? t('gasFeeWarning.titleDapp')
      : t('gasFeeWarning.title', { feeTokenSymbol: feeCurrencySymbol })
  const description =
    flow === GasFeeWarningFlow.Dapp
      ? t('gasFeeWarning.descriptionDapp', { amount: amountToAdd, tokenSymbol: feeCurrencySymbol })
      : prepareTransactionsResult.type === 'not-enough-balance-for-gas'
        ? t('gasFeeWarning.descriptionNotEnoughGas', {
            action: flowToActionString[flow],
            tokenSymbol: feeCurrencySymbol,
          })
        : t('gasWarning.descriptionMaxAmount', {
            action: flowToActionString[flow],
            tokenSymbol: feeCurrencySymbol,
          })
  const ctaLabel =
    flow === GasFeeWarningFlow.Dapp
      ? undefined
      : prepareTransactionsResult.type === 'not-enough-balance-for-gas'
        ? t('gasFeeWarning.cta', { tokenSymbol: feeCurrencySymbol })
        : t('gasWarning.ctaGasToken', {
            verb: flowToVerbString[flow],
          })
  return (
    <InLineNotification
      variant={NotificationVariant.Warning}
      title={title}
      description={description}
      ctaLabel={ctaLabel}
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

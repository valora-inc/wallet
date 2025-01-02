import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AppEvents } from 'src/analytics/Events'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import { Spacing } from 'src/styles/styles'
import { PreparedTransactionsResult } from 'src/viem/prepareTransactions'

export enum GasFeeWarningFlow {
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
  testIdPrefix,
}: {
  prepareTransactionsResult?: PreparedTransactionsResult
  flow: GasFeeWarningFlow
  onPressCta?: () => void
  testIdPrefix?: string
}) {
  const { t } = useTranslation()

  useEffect(() => {
    if (prepareTransactionsResult && prepareTransactionsResult.type !== 'possible') {
      AppAnalytics.track(AppEvents.gas_fee_warning_impression, {
        flow,
        errorType: prepareTransactionsResult.type,
        tokenId: feeCurrency.tokenId,
      })
    }
  }, [prepareTransactionsResult])

  if (!prepareTransactionsResult || prepareTransactionsResult.type === 'possible') {
    return false
  }

  const feeCurrency =
    prepareTransactionsResult.type === 'not-enough-balance-for-gas'
      ? prepareTransactionsResult.feeCurrencies[0]
      : prepareTransactionsResult.feeCurrency

  const flowToNotEnoughGasDescriptionString = {
    [GasFeeWarningFlow.Send]: t('gasFeeWarning.descriptionNotEnoughGas.sending', {
      tokenSymbol: feeCurrency.symbol,
    }),
    [GasFeeWarningFlow.Swap]: t('gasFeeWarning.descriptionNotEnoughGas.swapping', {
      tokenSymbol: feeCurrency.symbol,
    }),
    [GasFeeWarningFlow.Deposit]: t('gasFeeWarning.descriptionNotEnoughGas.depositing', {
      tokenSymbol: feeCurrency.symbol,
    }),
    [GasFeeWarningFlow.Withdraw]: t('gasFeeWarning.descriptionNotEnoughGas.withdrawing', {
      tokenSymbol: feeCurrency.symbol,
    }),
  }

  const flowToDescreasSpendDescriptionString = {
    [GasFeeWarningFlow.Send]: t('gasFeeWarning.descriptionMaxAmount.sending', {
      tokenSymbol: feeCurrency.symbol,
    }),
    [GasFeeWarningFlow.Swap]: t('gasFeeWarning.descriptionMaxAmount.swapping', {
      tokenSymbol: feeCurrency.symbol,
    }),
    [GasFeeWarningFlow.Deposit]: t('gasFeeWarning.descriptionMaxAmount.depositing', {
      tokenSymbol: feeCurrency.symbol,
    }),
    [GasFeeWarningFlow.Withdraw]: t('gasFeeWarning.descriptionMaxAmount.withdrawing', {
      tokenSymbol: feeCurrency.symbol,
    }),
  }

  const flowToCtaString = {
    [GasFeeWarningFlow.Send]: t('gasFeeWarning.ctaGasToken.send'),
    [GasFeeWarningFlow.Swap]: t('gasFeeWarning.ctaGasToken.swap'),
    [GasFeeWarningFlow.Deposit]: t('gasFeeWarning.ctaGasToken.deposit'),
    [GasFeeWarningFlow.Withdraw]: t('gasFeeWarning.ctaGasToken.withdraw'),
  }

  const title =
    flow === GasFeeWarningFlow.Dapp
      ? t('gasFeeWarning.titleDapp')
      : t('gasFeeWarning.title', { tokenSymbol: feeCurrency.symbol })
  const description =
    flow === GasFeeWarningFlow.Dapp
      ? t('gasFeeWarning.descriptionDapp', { tokenSymbol: feeCurrency.symbol })
      : prepareTransactionsResult.type === 'not-enough-balance-for-gas'
        ? flowToNotEnoughGasDescriptionString[flow]
        : flowToDescreasSpendDescriptionString[flow]
  const ctaLabel =
    flow === GasFeeWarningFlow.Dapp
      ? undefined
      : prepareTransactionsResult.type === 'not-enough-balance-for-gas'
        ? t('gasFeeWarning.cta', { tokenSymbol: feeCurrency.symbol })
        : flowToCtaString[flow]
  return (
    <InLineNotification
      variant={NotificationVariant.Warning}
      title={title}
      description={description}
      ctaLabel={ctaLabel}
      onPressCta={onPressCta}
      style={styles.warning}
      testID={`${testIdPrefix}/GasFeeWarning`}
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

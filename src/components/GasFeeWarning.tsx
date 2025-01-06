import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AppEvents } from 'src/analytics/Events'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import { CICOFlow } from 'src/fiatExchanges/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Spacing } from 'src/styles/styles'
import { PreparedTransactionsResult } from 'src/viem/prepareTransactions'

export type GasFeeWarningFlow = 'Send' | 'Swap' | 'Withdraw' | 'Deposit' | 'Dapp'

function GasFeeWarning({
  prepareTransactionsResult,
  flow,
  changeInputValueFn,
  testIdPrefix,
}: {
  prepareTransactionsResult?: PreparedTransactionsResult
  flow: GasFeeWarningFlow
  changeInputValueFn?: (amount: string) => void
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

  const title =
    flow === 'Dapp'
      ? t('gasFeeWarning.titleDapp')
      : t('gasFeeWarning.title', { tokenSymbol: feeCurrency.symbol })
  const description =
    flow === 'Dapp'
      ? t('gasFeeWarning.descriptionDapp', { tokenSymbol: feeCurrency.symbol })
      : prepareTransactionsResult.type === 'not-enough-balance-for-gas'
        ? t('gasFeeWarning.descriptionNotEnoughGas', {
            context: flow,
            tokenSymbol: feeCurrency.symbol,
          })
        : t('gasFeeWarning.descriptionMaxAmount', {
            context: flow,
            tokenSymbol: feeCurrency.symbol,
          })
  const ctaLabel =
    flow === 'Dapp'
      ? undefined
      : prepareTransactionsResult.type === 'not-enough-balance-for-gas'
        ? t('gasFeeWarning.ctaBuy', { tokenSymbol: feeCurrency.symbol })
        : t('gasFeeWarning.ctaAction', { context: flow })

  const onPressCta = () => {
    AppAnalytics.track(AppEvents.gas_fee_warning_cta_press, {
      flow,
      tokenId: feeCurrency.tokenId,
      errorType: prepareTransactionsResult.type,
    })
    prepareTransactionsResult.type === 'not-enough-balance-for-gas'
      ? navigate(Screens.FiatExchangeAmount, {
          tokenId: feeCurrency.tokenId,
          flow: CICOFlow.CashIn,
          tokenSymbol: feeCurrency.symbol,
        })
      : changeInputValueFn
        ? changeInputValueFn(prepareTransactionsResult.decreasedSpendAmount.toString())
        : null
  }
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

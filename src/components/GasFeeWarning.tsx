import React, { useEffect, useMemo } from 'react'
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
  onPressSmallerAmount,
}: {
  prepareTransactionsResult?: PreparedTransactionsResult
  flow: GasFeeWarningFlow
  onPressSmallerAmount?: (amount: string) => void
}) {
  const { t } = useTranslation()

  useEffect(() => {
    if (prepareTransactionsResult && prepareTransactionsResult.type !== 'possible') {
      AppAnalytics.track(AppEvents.gas_fee_warning_impression, {
        flow,
        errorType: prepareTransactionsResult.type,
        tokenId: feeCurrency.tokenId,
        networkId: feeCurrency.networkId,
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

  const title = t('gasFeeWarning.title', {
    context: flow === 'Dapp' ? 'Dapp' : undefined,
    tokenSymbol: feeCurrency.symbol,
  })

  const { description, ctaLabel } = useMemo(() => {
    if (flow === 'Dapp') {
      return {
        description: t('gasFeeWarning.descriptionDapp', { tokenSymbol: feeCurrency.symbol }),
        ctaLabel: undefined,
      }
    } else if (prepareTransactionsResult.type === 'not-enough-balance-for-gas') {
      return {
        description: t('gasFeeWarning.descriptionNotEnoughGas', {
          context: flow,
          tokenSymbol: feeCurrency.symbol,
        }),
        ctaLabel: t('gasFeeWarning.ctaBuy', { tokenSymbol: feeCurrency.symbol }),
      }
    } else {
      return {
        description: t('gasFeeWarning.descriptionMaxAmount', {
          context: flow,
          tokenSymbol: feeCurrency.symbol,
        }),
        ctaLabel: t('gasFeeWarning.ctaAction', { context: flow }),
      }
    }
  }, [flow, prepareTransactionsResult])

  const onPressCta = () => {
    AppAnalytics.track(AppEvents.gas_fee_warning_cta_press, {
      flow,
      tokenId: feeCurrency.tokenId,
      errorType: prepareTransactionsResult.type,
      networkId: feeCurrency.networkId,
    })
    if (prepareTransactionsResult.type === 'not-enough-balance-for-gas') {
      navigate(Screens.FiatExchangeAmount, {
        tokenId: feeCurrency.tokenId,
        flow: CICOFlow.CashIn,
        tokenSymbol: feeCurrency.symbol,
      })
    } else {
      onPressSmallerAmount
        ? onPressSmallerAmount(prepareTransactionsResult.decreasedSpendAmount.toString())
        : null
    }
  }
  return (
    <InLineNotification
      variant={NotificationVariant.Warning}
      title={title}
      description={description}
      ctaLabel={ctaLabel}
      onPressCta={onPressCta}
      style={styles.warning}
      testID={'GasFeeWarning'}
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

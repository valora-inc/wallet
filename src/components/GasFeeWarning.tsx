import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { FeeEvents } from 'src/analytics/Events'
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

  const feeCurrency = prepareTransactionsResult
    ? prepareTransactionsResult.type === 'not-enough-balance-for-gas'
      ? prepareTransactionsResult.feeCurrencies[0]
      : prepareTransactionsResult.feeCurrency
    : undefined

  useEffect(() => {
    if (feeCurrency && prepareTransactionsResult && prepareTransactionsResult.type !== 'possible') {
      AppAnalytics.track(FeeEvents.gas_fee_warning_impression, {
        flow,
        errorType: prepareTransactionsResult.type,
        tokenId: feeCurrency.tokenId,
        networkId: feeCurrency.networkId,
      })
    }
  }, [flow, prepareTransactionsResult, feeCurrency])

  const { title, description, ctaLabel, onPressCta } = useMemo(() => {
    if (
      !feeCurrency ||
      !prepareTransactionsResult ||
      prepareTransactionsResult.type === 'possible'
    ) {
      return {}
    }
    const title = t('gasFeeWarning.title', {
      context: flow,
      tokenSymbol: feeCurrency.symbol,
    })
    const trackCtaAnalytics = () => {
      AppAnalytics.track(FeeEvents.gas_fee_warning_cta_press, {
        flow,
        tokenId: feeCurrency.tokenId,
        errorType: prepareTransactionsResult.type,
        networkId: feeCurrency.networkId,
      })
    }
    if (flow === 'Dapp') {
      return {
        title,
        description: t('gasFeeWarning.descriptionDapp', { tokenSymbol: feeCurrency.symbol }),
        ctaLabel: undefined,
        onPressCta: undefined,
      }
    } else if (prepareTransactionsResult.type === 'not-enough-balance-for-gas') {
      return {
        title,
        ctaLabel: t('gasFeeWarning.ctaBuy', { tokenSymbol: feeCurrency.symbol }),
        onPressCta: () => {
          trackCtaAnalytics()
          navigate(Screens.FiatExchangeAmount, {
            tokenId: feeCurrency.tokenId,
            flow: CICOFlow.CashIn,
            tokenSymbol: feeCurrency.symbol,
          })
        },
      }
    } else {
      return {
        title,
        description: t('gasFeeWarning.descriptionMaxAmount', {
          context: flow,
          tokenSymbol: feeCurrency.symbol,
        }),
        ctaLabel: t('gasFeeWarning.ctaAction', { context: flow }),
        onPressCta: () => {
          trackCtaAnalytics()
          onPressSmallerAmount?.(prepareTransactionsResult.decreasedSpendAmount.toString())
        },
      }
    }
  }, [flow, prepareTransactionsResult, feeCurrency])

  if (!title) {
    return false
  }

  return (
    <InLineNotification
      variant={NotificationVariant.Warning}
      title={title}
      description={description ?? null}
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

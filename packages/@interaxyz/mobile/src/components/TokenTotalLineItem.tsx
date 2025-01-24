import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay, { formatValueToDisplay } from 'src/components/TokenDisplay'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { useTokenInfo } from 'src/tokens/hooks'
import { LocalAmount } from 'src/transactions/types'

interface Props {
  tokenAmount: BigNumber
  tokenId?: string
  localAmount?: LocalAmount
  feeToAddInUsd?: BigNumber | undefined
  hideSign?: boolean
  title?: string | null
  showLocalAmountForTotal?: boolean
  showApproxTotalBalance?: boolean
  showApproxExchangeRate?: boolean
}

export default function TokenTotalLineItem({
  tokenAmount,
  tokenId,
  localAmount,
  feeToAddInUsd,
  hideSign,
  title,
  showLocalAmountForTotal = true,
  showApproxTotalBalance = false,
  showApproxExchangeRate = false,
}: Props) {
  const { t } = useTranslation()
  const tokenInfo = useTokenInfo(tokenId)
  const feeInToken = tokenInfo?.priceUsd ? feeToAddInUsd?.dividedBy(tokenInfo.priceUsd) : undefined
  const showLocalAmountForSubtotal = !showLocalAmountForTotal

  return (
    <>
      <LineItemRow
        title={title ?? t('total')}
        textStyle={typeScale.labelSemiBoldMedium}
        amount={
          <TokenDisplay
            amount={tokenAmount.plus(feeInToken ?? 0)}
            tokenId={tokenId}
            localAmount={localAmount}
            showLocalAmount={showLocalAmountForTotal}
            hideSign={hideSign}
            showApprox={showApproxTotalBalance}
            testID="TotalLineItem/Total"
          />
        }
      />
      <LineItemRow
        title={
          <Text style={styles.exchangeRate} testID="TotalLineItem/ExchangeRate">
            <Trans
              i18nKey={showApproxExchangeRate ? 'tokenExchangeRateApprox' : 'tokenExchanteRate'}
              tOptions={{ symbol: tokenInfo?.symbol }}
            >
              {localAmount?.exchangeRate ? (
                `${
                  LocalCurrencySymbol[localAmount.currencyCode as LocalCurrencyCode]
                }${formatValueToDisplay(new BigNumber(localAmount.exchangeRate))}`
              ) : (
                <TokenDisplay amount={new BigNumber(1)} tokenId={tokenId} showLocalAmount={true} />
              )}
            </Trans>
          </Text>
        }
        amount={
          <TokenDisplay
            amount={tokenAmount.plus(feeInToken ?? 0)}
            tokenId={tokenId}
            showLocalAmount={showLocalAmountForSubtotal}
            hideSign={hideSign}
            testID="TotalLineItem/Subtotal"
          />
        }
        style={styles.subtotal}
        textStyle={styles.subtotalText}
      />
    </>
  )
}

const styles = StyleSheet.create({
  subtotal: {
    marginVertical: 0,
  },
  subtotalText: {
    ...typeScale.labelSmall,
    color: colors.gray4,
  },
  exchangeRate: {
    ...typeScale.labelSmall,
    color: colors.gray4,
  },
})

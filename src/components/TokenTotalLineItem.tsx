import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay, { formatValueToDisplay } from 'src/components/TokenDisplay'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { useTokenInfo } from 'src/tokens/hooks'
import { LocalAmount } from 'src/transactions/types'

interface Props {
  tokenAmount: BigNumber
  tokenId?: string
  localAmount?: LocalAmount
  feeToAddInUsd?: BigNumber | undefined
  feeToAddInToken?: BigNumber | undefined
  hideSign?: boolean
  title?: string | null
  showLocalAmount?: boolean
  newSendScreen?: boolean
  showApprox?: boolean
}

export default function TokenTotalLineItem({
  tokenAmount,
  tokenId,
  localAmount,
  feeToAddInUsd,
  feeToAddInToken,
  hideSign,
  title,
  showLocalAmount = true,
  showApprox = false,
  newSendScreen = false,
}: Props) {
  const { t } = useTranslation()
  const tokenInfo = useTokenInfo(tokenId)
  const feeInToken =
    feeToAddInToken ??
    (tokenInfo?.priceUsd ? feeToAddInUsd?.dividedBy(tokenInfo.priceUsd) : undefined)

  return (
    <>
      <LineItemRow
        title={title ?? t('total')}
        textStyle={fontStyles.regular600}
        amount={
          <TokenDisplay
            amount={tokenAmount.plus(feeInToken ?? 0)}
            tokenId={tokenId}
            localAmount={localAmount}
            showLocalAmount={showLocalAmount}
            hideSign={hideSign}
            showApprox={showApprox}
            testID="TotalLineItem/Total"
          />
        }
      />
      <LineItemRow
        title={
          <Text style={styles.exchangeRate} testID="TotalLineItem/ExchangeRate">
            <Trans
              i18nKey={newSendScreen ? 'tokenExchangeRateApprox' : 'tokenExchanteRate'}
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
            amount={tokenAmount.plus(newSendScreen ? feeInToken ?? 0 : 0)}
            tokenId={tokenId}
            showLocalAmount={!showLocalAmount}
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
    ...fontStyles.small,
    color: colors.gray4,
  },
  exchangeRate: {
    ...fontStyles.small,
    color: colors.gray4,
  },
})

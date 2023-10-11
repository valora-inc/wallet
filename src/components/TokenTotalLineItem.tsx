import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { useTokenInfo } from 'src/tokens/hooks'
import { LocalAmount } from 'src/transactions/types'
import { formatValueToDisplay } from 'src/components/TokenDisplay'

interface Props {
  tokenAmount: BigNumber
  tokenId?: string
  localAmount?: LocalAmount
  feeToAddInUsd?: BigNumber | undefined
  hideSign?: boolean
  title?: string | null
}

export default function TokenTotalLineItem({
  tokenAmount,
  tokenId,
  localAmount,
  feeToAddInUsd,
  hideSign,
  title,
}: Props) {
  const { t } = useTranslation()
  const tokenInfo = useTokenInfo(tokenId)
  const feeInToken = tokenInfo?.priceUsd ? feeToAddInUsd?.dividedBy(tokenInfo.priceUsd) : undefined

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
            hideSign={hideSign}
            testID="TotalLineItem/Total"
          />
        }
      />
      <LineItemRow
        title={
          <Text style={styles.exchangeRate} testID="TotalLineItem/ExchangeRate">
            <Trans i18nKey={'tokenExchanteRate'} tOptions={{ symbol: tokenInfo?.symbol }}>
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
            amount={tokenAmount}
            tokenId={tokenId}
            showLocalAmount={false}
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

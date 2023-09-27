import BigNumber from 'bignumber.js'
import * as React from 'react'
import { StyleProp, Text, TextStyle } from 'react-native'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import { getLocalCurrencySymbol, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { useTokenInfo, useTokenInfoBySymbol } from 'src/tokens/hooks'
import { LocalAmount } from 'src/transactions/types'
import { formatValueToDisplay } from 'src/components/NonNativeTokenDisplay'
import { Currency } from 'src/utils/currencies'

interface Props {
  amount: BigNumber.Value
  tokenId?: string
  currency?: Currency
  showSymbol?: boolean
  showLocalAmount?: boolean
  hideSign?: boolean
  showExplicitPositiveSign?: boolean
  localAmount?: LocalAmount
  style?: StyleProp<TextStyle>
  testID?: string
}

function TokenDisplay({
  amount,
  tokenId,
  showLocalAmount = true,
  showSymbol = true,
  showExplicitPositiveSign = false,
  hideSign = false,
  localAmount,
  style,
  testID,
  currency,
}: Props) {
  if (tokenId ? currency : !currency) {
    throw new Error('TokenDisplay must be passed either "currency" or "tokenId" and not both')
  }

  const tokenInfoFromId = useTokenInfo(tokenId!)
  const tokenInfoFromCurrency = useTokenInfoBySymbol(
    currency! === Currency.Celo ? 'CELO' : currency!
  )
  const tokenInfo = tokenInfoFromId || tokenInfoFromCurrency
  const localCurrencyExchangeRate = useSelector(usdToLocalCurrencyRateSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)

  const showError = showLocalAmount
    ? !localAmount && (!tokenInfo?.priceUsd || !localCurrencyExchangeRate)
    : !tokenInfo?.symbol

  const amountInUsd = tokenInfo?.priceUsd?.multipliedBy(amount)
  const amountInLocalCurrency = localAmount
    ? new BigNumber(localAmount.value)
    : new BigNumber(localCurrencyExchangeRate ?? 0).multipliedBy(amountInUsd ?? 0)
  const fiatSymbol = localAmount
    ? LocalCurrencySymbol[localAmount.currencyCode as LocalCurrencyCode]
    : localCurrencySymbol

  const amountToShow = showLocalAmount ? amountInLocalCurrency : new BigNumber(amount)

  const sign = hideSign ? '' : amountToShow.isNegative() ? '-' : showExplicitPositiveSign ? '+' : ''

  return (
    <Text style={style} testID={testID}>
      {showError ? (
        '-'
      ) : (
        <>
          {sign}
          {showLocalAmount && fiatSymbol}
          {formatValueToDisplay(amountToShow.absoluteValue())}
          {!showLocalAmount && showSymbol && ` ${tokenInfo?.symbol ?? ''}`}
        </>
      )}
    </Text>
  )
}

export default TokenDisplay

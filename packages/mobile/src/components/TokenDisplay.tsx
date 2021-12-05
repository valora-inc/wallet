import BigNumber from 'bignumber.js'
import * as React from 'react'
import { StyleProp, Text, TextStyle } from 'react-native'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
import { getLocalCurrencySymbol, localCurrencyToUsdSelector } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { CurrencyInfo } from 'src/send/SendConfirmationLegacy'
import { useTokenInfo } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'

const TAG = 'TokenDisplay'

const DEFAULT_DISPLAY_DECIMALS = 2

interface Props {
  amount: BigNumber.Value
  tokenAddress: string
  showSymbol?: boolean
  showLocalAmount?: boolean
  hideSign?: boolean
  showExplicitPositiveSign?: boolean
  currencyInfo?: CurrencyInfo
  style?: StyleProp<TextStyle>
  testID?: string
}

function useFiatExchangeRates(currencyInfo?: CurrencyInfo) {
  const localCurrencyExchangeRate = useSelector(localCurrencyToUsdSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)

  if (currencyInfo) {
    return {
      fiatExchangeRate: currencyInfo.localExchangeRate,
      fiatSymbol: LocalCurrencySymbol[currencyInfo.localCurrencyCode],
    }
  } else {
    return {
      fiatExchangeRate: localCurrencyExchangeRate,
      fiatSymbol: localCurrencySymbol,
    }
  }
}

function calculateDecimalsToShow(value: BigNumber) {
  const exponent = value?.e ?? 0
  if (exponent >= 0) {
    return DEFAULT_DISPLAY_DECIMALS
  }

  return Math.abs(exponent) + 1
}

// Formats |value| so that it shows at least 2 significant figures and at least 2 decimal places without trailing zeros.
export function formatValueToDisplay(value: BigNumber) {
  let decimals = calculateDecimalsToShow(value)
  let text = value.toFormat(decimals)
  while (text[text.length - 1] === '0' && decimals-- > 2) {
    text = text.substring(0, text.length - 1)
  }
  return text
}

function TokenDisplay({
  amount,
  tokenAddress,
  showLocalAmount = true,
  showSymbol = true,
  showExplicitPositiveSign = false,
  hideSign = false,
  currencyInfo,
  style,
  testID,
}: Props) {
  const tokenInfo = useTokenInfo(tokenAddress)

  const { fiatExchangeRate, fiatSymbol } = useFiatExchangeRates(currencyInfo)

  let error = false

  if (!tokenInfo) {
    Logger.error(TAG, `No token info found for token address ${tokenAddress}`)
    error = true
  } else if (showLocalAmount && (!tokenInfo.usdPrice || !fiatExchangeRate)) {
    Logger.error(
      TAG,
      `No token usd price or exchange rate found to display for ${tokenInfo.symbol}`
    )
    error = true
  }

  const amountInUsd = tokenInfo?.usdPrice?.multipliedBy(amount)
  const amountInLocalCurrency = new BigNumber(fiatExchangeRate ?? 0).multipliedBy(amountInUsd ?? 0)

  const amountToShow = showLocalAmount ? amountInLocalCurrency : new BigNumber(amount)

  const sign = hideSign ? '' : amountToShow.isNegative() ? '-' : showExplicitPositiveSign ? '+' : ''

  return (
    <Text style={style} testID={testID}>
      {sign}
      {showLocalAmount && fiatSymbol}
      {error ? '-' : formatValueToDisplay(amountToShow.absoluteValue())}
      {!showLocalAmount && showSymbol && ` ${tokenInfo?.symbol}`}
    </Text>
  )
}

export default TokenDisplay

import BigNumber from 'bignumber.js'
import * as React from 'react'
import { StyleProp, Text, TextStyle } from 'react-native'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
import { getLocalCurrencySymbol, localCurrencyToUsdSelector } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { CurrencyInfo } from 'src/send/SendConfirmation'
import { useTokenInfo } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'

const TAG = 'TokenDisplay'

// TODO: This should depend on the token. For example, wBTC should show more decimals,
// since 2 is still too big a value so the UI might show 0 for non-zero balances.
const DISPLAY_DECIMALS = 2

interface Props {
  amount: BigNumber.Value
  tokenAddress: string
  showSymbol?: boolean
  showLocalAmount?: boolean
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

function TokenDisplay({
  amount,
  tokenAddress,
  showLocalAmount = true,
  showSymbol = true,
  showExplicitPositiveSign = false,
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

  const sign = amountToShow.isNegative() ? '-' : showExplicitPositiveSign ? '+' : ''

  return (
    <Text style={style} testID={`${testID}/value`}>
      {sign}
      {showLocalAmount && fiatSymbol}
      {error ? '-' : amountToShow.absoluteValue().toFixed(DISPLAY_DECIMALS)}
      {!showLocalAmount && showSymbol && ` ${tokenInfo?.symbol}`}
    </Text>
  )
}

export default TokenDisplay

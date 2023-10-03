import BigNumber from 'bignumber.js'
import * as React from 'react'
import { StyleProp, Text, TextStyle } from 'react-native'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import { getLocalCurrencySymbol, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { useTokenInfoByAddress, useTokenInfoWithAddressBySymbol } from 'src/tokens/hooks'
import { LocalAmount } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'

const DEFAULT_DISPLAY_DECIMALS = 2

interface Props {
  amount: BigNumber.Value
  tokenAddress?: string | null
  currency?: Currency
  showSymbol?: boolean
  showLocalAmount?: boolean
  hideSign?: boolean
  showExplicitPositiveSign?: boolean
  localAmount?: LocalAmount
  style?: StyleProp<TextStyle>
  testID?: string
}

function calculateDecimalsToShow(value: BigNumber) {
  const exponent = value?.e ?? 0
  if (exponent >= 0) {
    return DEFAULT_DISPLAY_DECIMALS
  }

  return Math.abs(exponent) + 1
}

// Formats |value| so that it shows at least 2 significant figures and at least 2 decimal places without trailing zeros.
// TODO: Move this into TokenDisplay.tsx once LegacyTokenDisplay is removed
export function formatValueToDisplay(value: BigNumber) {
  let decimals = calculateDecimalsToShow(value)
  let text = value.toFormat(decimals)
  while (text[text.length - 1] === '0' && decimals-- > 2) {
    text = text.substring(0, text.length - 1)
  }
  return text
}

/**
 * @deprecated use TokenDisplay instead
 */
function LegacyTokenDisplay({
  amount,
  tokenAddress,
  currency,
  showLocalAmount = true,
  showSymbol = true,
  showExplicitPositiveSign = false,
  hideSign = false,
  localAmount,
  style,
  testID,
}: Props) {
  const showNativeTokens = getFeatureGate(StatsigFeatureGates.SHOW_NATIVE_TOKENS)
  if (!showNativeTokens && (tokenAddress ? currency : !currency)) {
    throw new Error(
      'LegacyTokenDisplay must be passed either "currency" or "tokenAddress" and not both'
    )
  } else if (tokenAddress && currency) {
    throw new Error(
      'LegacyTokenDisplay must be passed tokenAddress, currency, or nethier, but not both'
    )
  }

  const tokenInfoFromAddress = useTokenInfoByAddress(tokenAddress!)
  const tokenInfoFromCurrency = useTokenInfoWithAddressBySymbol(
    currency! === Currency.Celo ? 'CELO' : currency!
  )
  const tokenInfo = tokenInfoFromAddress || tokenInfoFromCurrency
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

export default LegacyTokenDisplay

import BigNumber from 'bignumber.js'
import { useMemo } from 'react'
import { MoneyAmount } from 'src/apollo/types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import {
  convertCurrencyToLocalAmount,
  convertDollarsToLocalAmount,
  convertLocalAmountToCurrency,
} from 'src/localCurrency/convert'
import {
  getLocalCurrencyCode,
  getLocalCurrencySymbol,
  getLocalCurrencyToDollarsExchangeRate,
  localCurrencyExchangeRatesSelector,
} from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { CurrencyInfo } from 'src/send/SendConfirmationLegacy'
import { useTokenInfoBySymbol } from 'src/tokens/hooks'
import { Currency } from 'src/utils/currencies'

export function useDollarToLocalRate() {
  return useSelector(getLocalCurrencyToDollarsExchangeRate)
}

export function useLocalCurrencyToShow(amount: MoneyAmount, currencyInfo?: CurrencyInfo) {
  let localCurrencyCode = useSelector(getLocalCurrencyCode)

  const usdOfOneLocal = useLocalAmountToCurrency(new BigNumber(1), Currency.Dollar)!
  const tokenUsdPrice = useTokenInfoBySymbol(amount.currencyCode)?.usdPrice
  if (!tokenUsdPrice) {
    throw new Error(`No USD price for ${amount.currencyCode}`)
  }
  const cRealLocalRate = new BigNumber(1).div(usdOfOneLocal).times(tokenUsdPrice)

  const amountCurrency = amount.currencyCode as Currency
  let localCurrencyExchangeRate = useSelector(localCurrencyExchangeRatesSelector)[amountCurrency]
  if (currencyInfo) {
    localCurrencyCode = currencyInfo.localCurrencyCode
    localCurrencyExchangeRate = currencyInfo.localExchangeRate
  } else if (amount.localAmount) {
    localCurrencyCode = amount.localAmount.currencyCode as LocalCurrencyCode
    localCurrencyExchangeRate = amount.localAmount.exchangeRate.toString()
  }

  if (amount.currencyCode === 'cREAL') {
    return {
      localCurrencyCode,
      localCurrencyExchangeRate: cRealLocalRate,
      amountCurrency: 'cREAL' as Currency | 'cREAL',
    }
  }
  // non-cREAL currency
  return { localCurrencyCode, localCurrencyExchangeRate, amountCurrency }
}

export function useDollarsToLocalAmount(amount: BigNumber.Value | null) {
  const exchangeRate = useDollarToLocalRate()
  const convertedAmount = convertDollarsToLocalAmount(amount, exchangeRate)
  if (!convertedAmount) {
    return null
  }
  return convertedAmount
}

export function useLocalCurrencyCode() {
  return useSelector(getLocalCurrencyCode)
}

export function useLocalCurrencySymbol() {
  return useSelector(getLocalCurrencySymbol)
}

export function useLocalAmountToCurrency(
  amount: BigNumber,
  currency: Currency | 'cREAL'
): BigNumber | null {
  const usdOfLocalCurrency = useLocalAmountToCurrency(amount, Currency.Dollar)
  const tokenUsdPrice = useTokenInfoBySymbol(currency)?.usdPrice
  const cRealResult = usdOfLocalCurrency?.dividedBy(tokenUsdPrice!) || new BigNumber(0)

  const exchangeRate = useSelector(localCurrencyExchangeRatesSelector)[currency as Currency]
  const result = useMemo(() => convertLocalAmountToCurrency(amount, exchangeRate), [
    amount,
    exchangeRate,
  ])
  if (currency === 'cREAL') {
    return cRealResult
  }
  return result
}

export function useCurrencyToLocalAmount(amount: BigNumber, currency: Currency): BigNumber | null {
  const exchangeRate = useSelector(localCurrencyExchangeRatesSelector)[currency]
  return useMemo(() => convertCurrencyToLocalAmount(amount, exchangeRate), [amount, exchangeRate])
}

export function convertBetweenCurrencies(
  amount: BigNumber,
  from: Currency,
  to: Currency,
  exchangeRates: { [currency in Currency]: string | null }
) {
  const localAmount = convertCurrencyToLocalAmount(amount, exchangeRates[from])
  return convertLocalAmountToCurrency(localAmount, exchangeRates[to])
}

// This hook is exclusively used for `currencyMaxAmount` in `FiatExchangeAmount.tsx`,
// and has been replaced. Should I remove it?
export function useConvertBetweenCurrencies(amount: BigNumber, from: Currency, to: Currency) {
  const exchangeRates = useSelector(localCurrencyExchangeRatesSelector)
  return useMemo(() => {
    if (from === to) {
      return amount
    }
    return convertBetweenCurrencies(amount, from, to, exchangeRates)
  }, [amount, exchangeRates, from, to])
}

export function useCurrencyToLocalAmountExchangeRate(currency: Currency) {
  return useSelector(localCurrencyExchangeRatesSelector)[currency]
}

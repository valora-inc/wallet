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
import { CurrencyInfo } from 'src/send/SendConfirmation'
import { Currency } from 'src/utils/currencies'

export function useDollarToLocalRate() {
  return useSelector(getLocalCurrencyToDollarsExchangeRate)
}

export function useLocalCurrencyToShow(amount: MoneyAmount, currencyInfo?: CurrencyInfo) {
  let localCurrencyCode = useSelector(getLocalCurrencyCode)
  const amountCurrency = amount.currencyCode as Currency
  let localCurrencyExchangeRate = useSelector(localCurrencyExchangeRatesSelector)[amountCurrency]
  if (currencyInfo) {
    localCurrencyCode = currencyInfo.localCurrencyCode
    localCurrencyExchangeRate = currencyInfo.localExchangeRate
  } else if (amount.localAmount) {
    localCurrencyCode = amount.localAmount.currencyCode as LocalCurrencyCode
    localCurrencyExchangeRate = amount.localAmount.exchangeRate.toString()
  }

  return { localCurrencyCode, localCurrencyExchangeRate, txCurrency: amountCurrency }
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

export function useLocalAmountToCurrency(amount: BigNumber, currency: Currency) {
  const exchangeRate = useSelector(localCurrencyExchangeRatesSelector)[currency]
  return useMemo(() => convertLocalAmountToCurrency(amount, exchangeRate), [amount, exchangeRate])
}

export function useCurrencyToLocalAmount(amount: BigNumber, currency: Currency) {
  const exchangeRate = useSelector(localCurrencyExchangeRatesSelector)[currency]
  return useMemo(() => convertCurrencyToLocalAmount(amount, exchangeRate), [amount, exchangeRate])
}

export function useConvertBetweenCurrencies(amount: BigNumber, from: Currency, to: Currency) {
  const exchangeRates = useSelector(localCurrencyExchangeRatesSelector)
  return useMemo(() => {
    if (from === to) {
      return amount
    }
    const localAmount = convertCurrencyToLocalAmount(amount, exchangeRates[from])
    return convertLocalAmountToCurrency(localAmount, exchangeRates[to])
  }, [amount, exchangeRates, from, to])
}

export function useCurrencyToLocalAmountExchangeRate(currency: Currency) {
  return useSelector(localCurrencyExchangeRatesSelector)[currency]
}

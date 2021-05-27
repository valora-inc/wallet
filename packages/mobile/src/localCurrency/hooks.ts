import BigNumber from 'bignumber.js'
import { MoneyAmount } from 'src/apollo/types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
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

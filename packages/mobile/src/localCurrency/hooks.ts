import BigNumber from 'bignumber.js'
import { MoneyAmount } from 'src/apollo/types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import {
  getLocalCurrencyCode,
  getLocalCurrencyExchangeRate,
  getLocalCurrencySymbol,
  localCurrencyExchangeRateSelector,
} from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { CurrencyInfo } from 'src/send/SendConfirmation'
import { currencyByCode } from 'src/utils/currencies'

export function useDollarToLocalRate() {
  return useSelector(getLocalCurrencyExchangeRate)
}

export function useLocalCurrencyToShow(amount: MoneyAmount, currencyInfo?: CurrencyInfo) {
  let localCurrencyCode = useSelector(getLocalCurrencyCode)
  const txCurrency = currencyByCode(amount.currencyCode)
  let localCurrencyExchangeRate = useSelector(localCurrencyExchangeRateSelector)[txCurrency]
  if (currencyInfo) {
    localCurrencyCode = currencyInfo.localCurrencyCode
    localCurrencyExchangeRate = currencyInfo.localExchangeRate
  } else if (amount.localAmount) {
    localCurrencyCode = amount.localAmount.currencyCode as LocalCurrencyCode
    localCurrencyExchangeRate = amount.localAmount.exchangeRate.toString()
  }

  return { localCurrencyCode, localCurrencyExchangeRate, txCurrency }
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

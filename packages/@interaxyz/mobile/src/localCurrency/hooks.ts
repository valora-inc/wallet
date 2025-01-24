import BigNumber from 'bignumber.js'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { getLocalCurrencyCode, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { CurrencyInfo } from 'src/localCurrency/types'
import { useSelector } from 'src/redux/hooks'
import { useTokenInfoWithAddressBySymbol } from 'src/tokens/hooks'
import { convertTokenToLocalAmount } from 'src/tokens/utils'
import { Currency } from 'src/utils/currencies'
import { MoneyAmount } from 'src/utils/moneyAmount'

export function useLocalCurrencyToShow(amount: MoneyAmount, currencyInfo?: CurrencyInfo) {
  let localCurrencyCode = useSelector(getLocalCurrencyCode)
  const amountCurrency = amount.currencyCode as Currency
  const tokenInfo = useTokenInfoWithAddressBySymbol(
    amountCurrency === Currency.Celo ? 'CELO' : amountCurrency
  )
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  let localCurrencyExchangeRate =
    convertTokenToLocalAmount({
      tokenAmount: new BigNumber(1),
      tokenInfo,
      usdToLocalRate,
    })?.toString() ?? null
  if (currencyInfo) {
    localCurrencyCode = currencyInfo.localCurrencyCode
    localCurrencyExchangeRate = currencyInfo.localExchangeRate
  } else if (amount.localAmount) {
    localCurrencyCode = amount.localAmount.currencyCode as LocalCurrencyCode
    localCurrencyExchangeRate = amount.localAmount.exchangeRate.toString()
  }

  return { localCurrencyCode, localCurrencyExchangeRate, amountCurrency }
}

export function useDollarsToLocalAmount(amount: BigNumber.Value | null) {
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  const convertedAmount = convertDollarsToLocalAmount(amount, usdToLocalRate)
  if (!convertedAmount) {
    return null
  }
  return convertedAmount
}

export function useLocalCurrencyCode() {
  return useSelector(getLocalCurrencyCode)
}

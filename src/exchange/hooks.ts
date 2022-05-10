import { exchangeRatesSelector } from 'src/exchange/reducer'
import useSelector from 'src/redux/useSelector'
import { Currency } from 'src/utils/currencies'
import { getRateForMakerToken } from 'src/utils/currencyExchange'

export function useDollarToCeloExchangeRate() {
  const exchangeRates = useSelector(exchangeRatesSelector)
  return getRateForMakerToken(exchangeRates, Currency.Celo, Currency.Dollar)
}

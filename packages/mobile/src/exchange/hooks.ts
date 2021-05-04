import BigNumber from 'bignumber.js'
import { getExchangeRatePair } from 'src/exchange/selectors'
import useSelector from 'src/redux/useSelector'
import { Currency } from 'src/utils/currencies'
import { getRateForMakerToken, goldToDollarAmount } from 'src/utils/currencyExchange'

export function useExchangeRate() {
  return getRateForMakerToken(useSelector(getExchangeRatePair), Currency.Dollar, Currency.Celo)
}

export function useGoldToDollarAmount(amount: BigNumber.Value) {
  const exchangeRate = useExchangeRate()
  return goldToDollarAmount(amount, exchangeRate)
}

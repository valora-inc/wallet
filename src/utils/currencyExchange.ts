/* Helper functions for converting between stable and gold currencies */
import BigNumber from 'bignumber.js'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
const TAG = 'utils/currencyExchange'

type numberT = number | string | BigNumber | null

export function getRateForMakerToken(
  exchangeRates: Record<Currency, Record<Currency, string>> | null,
  makerToken: Currency,
  takerToken: Currency
) {
  if (!exchangeRates) {
    return new BigNumber(0)
  }

  const rateBN: BigNumber = new BigNumber(exchangeRates[makerToken][takerToken])

  if (rateBN.isZero()) {
    Logger.warn(TAG, `Rate for token ${makerToken} is 0`)
    return new BigNumber(0)
  }

  return rateBN
}

export function getTakerAmount(makerAmount: numberT, exchangeRate: numberT, decimals?: number) {
  const amountBN: BigNumber = new BigNumber(makerAmount || 0)
  const rateBN: BigNumber = new BigNumber(exchangeRate || 0)

  if (amountBN.isNaN() || rateBN.isNaN()) {
    Logger.warn(TAG, 'Amount or rate is NaN')
    return new BigNumber(0)
  }

  if (rateBN.isZero()) {
    Logger.warn(TAG, 'Exchange rate is 0')
    return new BigNumber(0)
  }
  let converted = amountBN.dividedBy(rateBN)
  if (decimals !== undefined) {
    converted = converted.decimalPlaces(decimals, BigNumber.ROUND_DOWN)
  }

  return converted
}

export function getNewMakerBalance(previousBalance: string | null, delta: BigNumber) {
  return new BigNumber(previousBalance || 0).minus(delta)
}

export function getNewTakerBalance(previousBalance: string | null, delta: BigNumber) {
  return new BigNumber(previousBalance || 0).plus(delta)
}

export function getNewDollarBalance(
  dollarBalance: string | null,
  makerToken: Currency,
  makerAmount: BigNumber,
  takerAmount: BigNumber
) {
  return makerToken === Currency.Dollar
    ? getNewMakerBalance(dollarBalance, makerAmount)
    : getNewTakerBalance(dollarBalance, takerAmount)
}

export function getNewGoldBalance(
  goldBalance: string | null,
  makerToken: Currency,
  makerAmount: BigNumber,
  takerAmount: BigNumber
) {
  return makerToken === Currency.Celo
    ? getNewMakerBalance(goldBalance, makerAmount)
    : getNewTakerBalance(goldBalance, takerAmount)
}

export function goldToDollarAmount(amount: BigNumber.Value, exchangeRate: BigNumber | null) {
  const isRateValid = exchangeRate && !exchangeRate.isZero() && exchangeRate.isFinite()
  if (!isRateValid) {
    return null
  }

  const convertedAmount = getTakerAmount(new BigNumber(amount), exchangeRate)
  if (!convertedAmount) {
    return null
  }

  return convertedAmount
}

import { ContractKit, StableToken } from '@celo/contractkit'
import { CURRENCY_ENUM } from '@celo/utils'
import BigNumber from 'bignumber.js'
import { performance } from 'perf_hooks'
import { writeExchangeRatePair } from '../firebase'
import { metrics } from '../metrics'
import { getContractKit } from '../util/utils'

// Amounts to estimate the exchange rate, as the rate varies based on transaction size
// A small amount returns a rate closer to the median rate
// TODO: Use CELO_AMOUNT_FOR_ESTIMATE and DOLLAR_AMOUNT_FOR_ESTIMATE from `@celo/utils`
const WEI_PER_UNIT = 1000000000000000000
const SELL_AMOUNTS = {
  [CURRENCY_ENUM.DOLLAR]: new BigNumber(0.01 * WEI_PER_UNIT), // 0.01 dollar
  [CURRENCY_ENUM.GOLD]: new BigNumber(0.01 * WEI_PER_UNIT), // 0.01 gold
  [CURRENCY_ENUM.EURO]: new BigNumber(0.01 * WEI_PER_UNIT), // 0.01 euro
}

export async function handleExchangeQuery() {
  const contractKitInstance = await getContractKit()
  const fetchTime = Date.now()
  const [dollarMakerRate, goldMakerRate] = await Promise.all([
    getExchangeRate(CURRENCY_ENUM.DOLLAR, contractKitInstance, StableToken.cUSD),
    getExchangeRate(CURRENCY_ENUM.GOLD, contractKitInstance, StableToken.cUSD),
  ])

  const [euroMakerRate, goldMakerRateEur] = await Promise.all([
    getExchangeRate(CURRENCY_ENUM.EURO, contractKitInstance, StableToken.cEUR),
    getExchangeRate(CURRENCY_ENUM.GOLD, contractKitInstance, StableToken.cEUR),
  ])

  writeExchangeRatePair(
    CURRENCY_ENUM.GOLD,
    CURRENCY_ENUM.DOLLAR,
    dollarMakerRate.toString(),
    fetchTime
  )
  writeExchangeRatePair(
    CURRENCY_ENUM.DOLLAR,
    CURRENCY_ENUM.GOLD,
    goldMakerRate.toString(),
    fetchTime
  )
  writeExchangeRatePair(CURRENCY_ENUM.GOLD, CURRENCY_ENUM.EURO, euroMakerRate.toString(), fetchTime)
  writeExchangeRatePair(
    CURRENCY_ENUM.EURO,
    CURRENCY_ENUM.GOLD,
    goldMakerRateEur.toString(),
    fetchTime
  )
}

// Note difference in gold vs dollar rate due the Exchange's forced spread of 0.5%
// TODO: Fetch this data by listening directly for a MedianUpdated event on chain
async function getExchangeRate(
  makerToken: CURRENCY_ENUM,
  contractKitInstance: ContractKit,
  stableToken: StableToken
) {
  const exchange = await contractKitInstance.contracts.getExchange(stableToken)

  // Measure time before query
  const t0 = performance.now()

  const rate = await exchange.getExchangeRate(
    SELL_AMOUNTS[makerToken],
    makerToken === CURRENCY_ENUM.GOLD
  )

  // Measure time after query
  const t1 = performance.now()
  metrics.setExchangeQueryDuration(t1 - t0)

  return rate
}

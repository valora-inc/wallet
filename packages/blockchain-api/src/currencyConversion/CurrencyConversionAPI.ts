import { DataSource, DataSourceConfig } from 'apollo-datasource'
import BigNumber from 'bignumber.js'
import { CurrencyConversionArgs, MoneyAmount } from '../schema'
import {
  CGLD,
  CUSD,
  stablePairs,
  supportedCurrencies,
  supportedPairs,
  supportedStableTokens,
  USD,
} from './consts'
import ExchangeRateAPI from './ExchangeRateAPI'
import GoldExchangeRateAPI from './GoldExchangeRateAPI'

function insertIf<T>(condition: boolean, element: T) {
  return condition ? [element] : []
}

export default class CurrencyConversionAPI<TContext = any> extends DataSource {
  exchangeRateAPI = new ExchangeRateAPI()
  goldExchangeRateAPI = new GoldExchangeRateAPI()

  initialize(config: DataSourceConfig<TContext>): void {
    this.exchangeRateAPI.initialize(config)
    this.goldExchangeRateAPI.initialize(config)
  }

  async getExchangeRate({
    sourceCurrencyCode,
    currencyCode,
    timestamp,
    impliedExchangeRates,
  }: CurrencyConversionArgs): Promise<BigNumber> {
    const fromCode = sourceCurrencyCode || USD
    const toCode = currencyCode

    const steps = this.getConversionSteps(fromCode, toCode)
    const ratesPromises = []
    for (let i = 1; i < steps.length; i++) {
      const prevCode = steps[i - 1]
      const code = steps[i]
      ratesPromises.push(
        this.getSupportedExchangeRate(prevCode, code, timestamp, impliedExchangeRates)
      )
    }

    const rates = await Promise.all(ratesPromises)

    // Multiply all rates
    return rates.reduce((acc, rate) => acc.multipliedBy(rate), new BigNumber(1))
  }

  // Get conversion steps given the data we have today
  // Going from cGLD to local currency (or vice versa) is currently assumed to be the same as cGLD -> cUSD -> USD -> local currency.
  // And similar to cUSD to local currency, but with one less step.
  private getConversionSteps(fromCode: string, toCode: string) {
    if (fromCode === toCode) {
      // Same code, nothing to do
      return []
    } else if (fromCode === CGLD || toCode === CGLD) {
      // cGLD -> X (where X !== celoStableToken)
      if (fromCode === CGLD && !this.enumContains(supportedStableTokens, toCode.toUpperCase())) {
        if (this.enumContains(supportedCurrencies, toCode) && toCode !== USD) {
          return [CGLD, this.getStableToken(toCode), toCode]
        }
        return [CGLD, CUSD, ...insertIf(toCode !== USD, USD), toCode]
      }
      // Currency -> cGLD (where X !== celoStableToken)
      else if (
        !this.enumContains(supportedStableTokens, fromCode.toUpperCase()) &&
        toCode === CGLD
      ) {
        if (this.enumContains(supportedCurrencies, fromCode) && fromCode !== USD) {
          return [fromCode, this.getStableToken(fromCode), CGLD]
        }
        return [fromCode, ...insertIf(fromCode !== USD, USD), CUSD, CGLD]
      }
    } else {
      // celoStableToken -> X (where X!== currency)
      if (
        this.enumContains(supportedStableTokens, fromCode.toUpperCase()) &&
        this.getCurrency(fromCode) !== toCode
      ) {
        return [fromCode, this.getCurrency(fromCode), toCode]
      }
      // currency -> X (where X!== celoStableToken)
      else if (
        this.getCurrency(toCode) !== fromCode &&
        this.enumContains(supportedStableTokens, toCode.toUpperCase())
      ) {
        return [fromCode, this.getCurrency(toCode), toCode]
      }
    }
    return [fromCode, toCode]
  }

  private enumContains(x: any, code: string) {
    return Object.values(x).includes(code)
  }

  private getStableToken(code: string) {
    return 'c' + code
  }

  private getCurrency(code: string) {
    return code.substring(1)
  }

  private getSupportedExchangeRate(
    fromCode: string,
    toCode: string,
    timestamp?: number,
    impliedExchangeRates?: MoneyAmount['impliedExchangeRates']
  ): BigNumber | Promise<BigNumber> {
    const pair = `${fromCode}/${toCode}`
    if (impliedExchangeRates && impliedExchangeRates[pair]) {
      return new BigNumber(impliedExchangeRates[pair])
    }
    if (this.enumContains(stablePairs, pair)) {
      // TODO: use real rates once we have the data
      return new BigNumber(1)
    } else if (this.enumContains(supportedPairs, pair)) {
      if (pair === 'cGLD/cEUR' || pair === 'cEUR/cGLD') {
        // TODO: Get the real value. Currently firebase don't keep this rate.
        return this.goldExchangeRateAPI.getExchangeRate({
          sourceCurrencyCode: fromCode,
          currencyCode: toCode,
          timestamp,
        })
      }
      return this.goldExchangeRateAPI.getExchangeRate({
        sourceCurrencyCode: fromCode,
        currencyCode: toCode,
        timestamp,
      })
    } else {
      return this.exchangeRateAPI.getExchangeRate({
        sourceCurrencyCode: fromCode,
        currencyCode: toCode,
        timestamp,
      })
    }
  }
}

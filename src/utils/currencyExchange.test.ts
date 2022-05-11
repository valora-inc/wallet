import BigNumber from 'bignumber.js'
import { ExchangeRates } from 'src/exchange/reducer'
import { Currency } from 'src/utils/currencies'
import {
  getNewMakerBalance,
  getNewTakerBalance,
  getRateForMakerToken,
  getTakerAmount,
} from 'src/utils/currencyExchange'
import { makeExchangeRates } from 'test/values'

const exchangeRates: ExchangeRates = makeExchangeRates('0.11', '10')

describe('getRateForMakerToken', () => {
  it('when DOLLAR returns exchange rate', () => {
    expect(getRateForMakerToken(exchangeRates, Currency.Dollar, Currency.Celo)).toEqual(
      new BigNumber('10')
    )
  })

  it('when GOLD returns exchange rate based on direction', () => {
    expect(getRateForMakerToken(exchangeRates, Currency.Celo, Currency.Dollar)).toEqual(
      new BigNumber('0.11')
    )
  })
  it('when empty rate it does not crash', () => {
    expect(getRateForMakerToken(null, Currency.Celo, Currency.Dollar)).toEqual(new BigNumber('0'))
  })
})

describe('getTakerAmount', () => {
  it('converts the maker currency into taker currency', () => {
    expect(
      getTakerAmount(new BigNumber('33'), exchangeRates[Currency.Dollar][Currency.Celo])
    ).toEqual(new BigNumber('3.3'))
  })
  it('returns 0 if receives a null', () => {
    expect(getTakerAmount(null, new BigNumber(0.5))).toEqual(new BigNumber('0'))
  })
  it('when garbage rate it does not crash', () => {
    expect(getTakerAmount('hello', 'goodbye')).toEqual(new BigNumber('0'))
  })
  it('rounds correctly', () => {
    expect(getTakerAmount(20, 0.11, 0)).toEqual(new BigNumber(181))
    expect(getTakerAmount(20, 0.11, 2)).toEqual(new BigNumber(181.81))
  })
})

describe('getNewMakerBalance', () => {
  it('currently sums the amounts', () => {
    expect(getNewMakerBalance('2000', new BigNumber(20)).toString()).toEqual('1980')
  })
})

describe('getNewTakerBalance', () => {
  it('currently sums the amounts', () => {
    expect(getNewTakerBalance('2000', new BigNumber(20)).toString()).toEqual('2020')
  })
})

import { InMemoryLRUCache } from 'apollo-server-caching'
import BigNumber from 'bignumber.js'
import CurrencyConversionAPI from './CurrencyConversionAPI'
import ExchangeRateAPI from './ExchangeRateAPI'
import GoldExchangeRateAPI from './GoldExchangeRateAPI'

jest.mock('./ExchangeRateAPI')
jest.mock('./GoldExchangeRateAPI')

const mockDefaultGetExchangeRate = ExchangeRateAPI.prototype.getExchangeRate as jest.Mock
mockDefaultGetExchangeRate.mockResolvedValue(new BigNumber(20))

const mockGoldGetExchangeRate = GoldExchangeRateAPI.prototype.getExchangeRate as jest.Mock
mockGoldGetExchangeRate.mockResolvedValue(new BigNumber(10))

describe('CurrencyConversionAPI', () => {
  let currencyConversionAPI: CurrencyConversionAPI

  beforeEach(() => {
    jest.clearAllMocks()
    currencyConversionAPI = new CurrencyConversionAPI()
    currencyConversionAPI.initialize({ context: {}, cache: new InMemoryLRUCache() })
  })

  it('should retrieve rate for cGLD/cUSD', async () => {
    const impliedExchangeRates = { 'cGLD/cUSD': new BigNumber(10) }
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'cUSD',
      impliedExchangeRates,
    })
    expect(result).toEqual(new BigNumber(10))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should retrieve rate for cUSD/cGLD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cUSD',
      currencyCode: 'cGLD',
    })
    expect(result).toEqual(new BigNumber(10))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(1)
  })

  it('should retrieve rate for cGLD/USD', async () => {
    const impliedExchangeRates = { 'cGLD/cUSD': new BigNumber(10) }
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'USD',
      impliedExchangeRates,
    })
    expect(result).toEqual(new BigNumber(10))

    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should retrieve rate for USD/cGLD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'USD',
      currencyCode: 'cGLD',
    })
    expect(result).toEqual(new BigNumber(10))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(1)
  })

  it('should retrieve rate for cGLD/MXN', async () => {
    const impliedExchangeRates = { 'cGLD/cUSD': new BigNumber(10) }
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'MXN',
      impliedExchangeRates,
    })
    expect(result).toEqual(new BigNumber(200))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should retrieve rate for MXN/cGLD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'MXN',
      currencyCode: 'cGLD',
    })
    expect(result).toEqual(new BigNumber(200))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(1)
  })

  it('should retrieve rate for USD/MXN', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'USD',
      currencyCode: 'MXN',
    })
    expect(result).toEqual(new BigNumber(20))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should retrieve rate for MXN/USD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'MXN',
      currencyCode: 'USD',
    })
    expect(result).toEqual(new BigNumber(20))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should retrieve rate for cUSD/MXN', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cUSD',
      currencyCode: 'MXN',
    })
    expect(result).toEqual(new BigNumber(20))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should retrieve rate for MXN/cUSD', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'MXN',
      currencyCode: 'cUSD',
    })
    expect(result).toEqual(new BigNumber(20))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(1)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should return 1 when using the same currency code', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'ABC',
      currencyCode: 'ABC',
    })
    expect(result).toEqual(new BigNumber(1))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  it('should return 2 when using the same currency code', async () => {
    const result = await currencyConversionAPI.getExchangeRate({
      sourceCurrencyCode: 'cGLD',
      currencyCode: 'EUR',
    })
    expect(result).toEqual(new BigNumber(2))
    expect(mockDefaultGetExchangeRate).toHaveBeenCalledTimes(0)
    expect(mockGoldGetExchangeRate).toHaveBeenCalledTimes(0)
  })

  // it('should return the currencies steps expected', async () => {
  //   const result = await currencyConversionAPI.getConversionSteps(
  //     'ABC',
  //     'ABC',
  //   )
  //   expect(result).toEqual([])
  // })

  // it('should return the currencies steps CGLD -> cUSD -> USD', async () => {
  //   const result = await currencyConversionAPI.getConversionSteps(
  //     'cGLD',
  //     'USD',
  //   )
  //   expect(result).toEqual(['cGLD', 'cUSD', 'USD'])
  // })
  // it('should return the currencies steps CGLD -> cEUR -> EUR', async () => {
  //   const result = await currencyConversionAPI.getConversionSteps(
  //     'cGLD',
  //     'EUR',
  //   )
  //   expect(result).toEqual(['cGLD', 'cEUR', 'EUR'])
  // })
  // it('should return the currencies steps EUR -> cEUR -> CGLD', async () => {
  //   const result = await currencyConversionAPI.getConversionSteps(
  //     'EUR',
  //     'cGLD',
  //   )
  //   expect(result).toEqual(['EUR', 'cEUR', 'cGLD'])
  // })
  // it('should return the currencies steps cUSD -> USD -> MXN', async () => {
  //   const result = await currencyConversionAPI.getConversionSteps(
  //     'cUSD',
  //     'MXN',
  //   )
  //   expect(result).toEqual(['cUSD', 'USD', 'MXN'])
  // })
  // it('should return the currencies steps cEUR -> EUR -> MXN', async () => {
  //   const result = await currencyConversionAPI.getConversionSteps(
  //     'cEUR',
  //     'MXN',
  //   )
  //   expect(result).toEqual(['cEUR', 'EUR', 'MXN'])
  // })
})

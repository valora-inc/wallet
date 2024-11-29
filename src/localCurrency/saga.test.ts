import { FetchMock } from 'jest-fetch-mock'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { fetchExchangeRate } from 'src/localCurrency/saga'

const now = Date.now()
Date.now = jest.fn(() => now)
const mockFetch = fetch as FetchMock

describe(fetchExchangeRate, () => {
  it('does not fetch when the local currency code is the same as source currency code', async () => {
    await fetchExchangeRate(LocalCurrencyCode.USD)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('fetches the exchange rate and returns it', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({ rate: 1.33 }))
    await fetchExchangeRate(LocalCurrencyCode.PHP)
    expect(mockFetch).toHaveBeenCalled()
  })

  it('throws when received status is other than 200', async () => {
    mockFetch.mockResponseOnce('error', { status: 500, statusText: 'some error' })

    const result = fetchExchangeRate(LocalCurrencyCode.PHP)
    await expect(result).rejects.toThrow('Failed to fetch exchange rate: 500 some error')
  })

  it('throws when receives unxepected data', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({ message: 'Unexpected error' }))

    const result = fetchExchangeRate(LocalCurrencyCode.PHP)
    await expect(result).rejects.toThrow('Invalid response data {"message":"Unexpected error"}')
  })
})

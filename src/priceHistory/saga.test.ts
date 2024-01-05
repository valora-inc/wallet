import { FetchMock } from 'jest-fetch-mock'
import { expectSaga } from 'redux-saga-test-plan'
import { fetchTokenPriceHistory, fetchTokenPriceHistorySaga } from 'src/priceHistory/saga'
import { Price, fetchPriceHistoryFailure, fetchPriceHistorySuccess } from 'src/priceHistory/slice'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { mockCusdTokenId } from 'test/values'

const mockFetch = fetch as FetchMock
jest.mock('src/utils/Logger')

describe('watchFetchTokenPriceHistory', () => {
  const mockPrices = [
    {
      priceFetchedAt: 1700378258000,
      priceUsd: '0.97',
    },
    {
      priceFetchedAt: 1701659858000,
      priceUsd: '1.2',
    },
    {
      priceFetchedAt: 1702941458000,
      priceUsd: '1.4',
    },
  ] as Price[]

  beforeEach(() => {
    mockFetch.resetMocks()
  })

  it('successfully fetches token price history', async () => {
    mockFetch.mockResponseOnce(JSON.stringify(mockPrices), {
      status: 200,
    })
    await expectSaga(fetchTokenPriceHistorySaga, {
      payload: {
        tokenId: mockCusdTokenId,
        startTimestamp: 1700378258000,
        endTimestamp: 1702941458000,
      },
    } as any)
      .put(
        fetchPriceHistorySuccess({
          tokenId: mockCusdTokenId,
          prices: mockPrices,
        })
      )
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `${networkConfig.blockchainApiUrl}/tokensInfo/${mockCusdTokenId}/priceHistory?startTimestamp=1700378258000&endTimestamp=1702941458000`,
      expect.any(Object)
    )
  })

  it('logs an error on failed fetches', async () => {
    mockFetch.mockResponseOnce('Internal Server Error', {
      status: 500,
    })

    await expectSaga(fetchTokenPriceHistorySaga, {
      payload: {
        tokenId: mockCusdTokenId,
        startTimestamp: 1700378258000,
        endTimestamp: 1702941458000,
      },
    } as any)
      .put(
        fetchPriceHistoryFailure({
          tokenId: mockCusdTokenId,
        })
      )
      .run()

    expect(Logger.error).toHaveBeenLastCalledWith(
      'priceHistory/saga',
      'error fetching token price history',
      `Failed to fetch price history for ${mockCusdTokenId}: 500 Internal Server Error`
    )
  })

  describe('fetchTokenPriceHistory', () => {
    it('handles 200 response', async () => {
      mockFetch.mockResponseOnce(JSON.stringify(mockPrices), {
        status: 200,
      })
      const prices = await fetchTokenPriceHistory(mockCusdTokenId, 1700378258000, 1702941458000)
      expect(prices).toEqual(mockPrices)
    })

    it.each([
      {
        status: 400,
        statusText: 'Bad Request',
        testName: 'handles 400 response',
      },
      {
        status: 418,
        statusText: "I'm a Teapot",
        testName: 'handles 418 response',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
        testName: 'handles 500 response',
      },
    ])('$testName', async ({ status, statusText }) => {
      mockFetch.mockResponseOnce(statusText, {
        status: status,
      })
      await expect(
        fetchTokenPriceHistory(mockCusdTokenId, 1700378258000, 1702941458000)
      ).rejects.toThrow(
        `Failed to fetch price history for ${mockCusdTokenId}: ${status} ${statusText}`
      )
    })
  })
})

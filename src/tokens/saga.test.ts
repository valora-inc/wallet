import BigNumber from 'bignumber.js'
import { FetchMock } from 'jest-fetch-mock'
import { expectSaga } from 'redux-saga-test-plan'
import { dynamic, throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import {
  fetchTokenBalancesForAddress,
  fetchTokenBalancesSaga,
  fetchTokenPriceHistorySaga,
  getTokensInfo,
  tokenAmountInSmallestUnit,
  watchAccountFundedOrLiquidated,
} from 'src/tokens/saga'
import { lastKnownTokenBalancesSelector } from 'src/tokens/selectors'
import {
  StoredTokenBalance,
  StoredTokenBalances,
  TokenPriceHistoryEntry,
  fetchPriceHistoryFailure,
  fetchPriceHistorySuccess,
  fetchTokenBalancesFailure,
  setTokenBalances,
} from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import {
  mockAccount,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockPoofAddress,
  mockPoofTokenId,
  mockTokenBalances,
} from 'test/values'

jest.mock('src/statsig')
jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      networkToNetworkId: {
        celo: 'celo-alfajores',
        ethereum: 'ethereum-sepolia',
      },
      defaultNetworkId: 'celo-alfajores',
    },
  }
})
jest.mock('src/utils/Logger')

const mockFetch = fetch as FetchMock

const mockBlockchainApiTokenInfo: StoredTokenBalances = {
  [mockPoofTokenId]: {
    ...mockTokenBalances[mockPoofTokenId],
    balance: null,
  },
  [mockCusdTokenId]: {
    ...mockTokenBalances[mockCusdTokenId],
    balance: null,
  },
  [mockCeurAddress]: {
    ...mockTokenBalances[mockCeurTokenId],
    balance: null,
  },
}

const fetchBalancesResponse = [
  {
    tokenAddress: mockPoofAddress,
    tokenId: mockPoofTokenId,
    balance: (5 * Math.pow(10, 18)).toString(),
    decimals: '18',
  },
  {
    tokenAddress: mockCusdAddress,
    tokenId: mockCusdTokenId,
    balance: '0',
    decimals: '18',
  },
  // cEUR intentionally missing
]

describe('getTokensInfo', () => {
  beforeEach(() => {
    mockFetch.resetMocks()
  })
  it('returns payload if response OK', async () => {
    mockFetch.mockResponseOnce('{"some": "data"}')

    const result = await getTokensInfo()
    expect(result).toEqual({
      some: 'data',
    })
  })
  it('throws if request does not complete within timeout', async () => {
    mockFetch.mockResponseOnce('error!', { status: 500, statusText: 'some error' })
    await expect(getTokensInfo()).rejects.toEqual(
      new Error('Failure response fetching token info. 500  some error')
    )
    expect(Logger.error).toHaveBeenCalledTimes(1)
  })
})
describe(fetchTokenBalancesSaga, () => {
  const tokenBalancesAfterUpdate: StoredTokenBalances = {
    ...mockBlockchainApiTokenInfo,
    [mockPoofTokenId]: {
      ...(mockBlockchainApiTokenInfo[mockPoofTokenId] as StoredTokenBalance),
      balance: '5', // should convert to ethers (rather than keep in wei)
    },
    [mockCusdTokenId]: {
      ...(mockBlockchainApiTokenInfo[mockCusdTokenId] as StoredTokenBalance),
      balance: '0',
    },
  }
  it('get token info successfully', async () => {
    await expectSaga(fetchTokenBalancesSaga)
      .provide([
        [call(getTokensInfo), mockBlockchainApiTokenInfo],
        [select(walletAddressSelector), mockAccount],
        [call(fetchTokenBalancesForAddress, mockAccount), fetchBalancesResponse],
      ])
      .put(setTokenBalances(tokenBalancesAfterUpdate))
      .run()
  })

  it("nothing happens if there's no address in the store", async () => {
    await expectSaga(fetchTokenBalancesSaga)
      .provide([
        [select(walletAddressSelector), null],
        [call(getTokensInfo), mockBlockchainApiTokenInfo],
        [call(fetchTokenBalancesForAddress, mockAccount), fetchBalancesResponse],
      ])
      .not.call(getTokensInfo)
      .not.put(setTokenBalances(tokenBalancesAfterUpdate))
      .run()
  })

  it("fires an event if there's an error", async () => {
    await expectSaga(fetchTokenBalancesSaga)
      .provide([
        [call(getTokensInfo), mockBlockchainApiTokenInfo],
        [select(walletAddressSelector), mockAccount],
        [call(fetchTokenBalancesForAddress, mockAccount), throwError(new Error('Error message'))],
      ])
      .not.put(setTokenBalances(tokenBalancesAfterUpdate))
      .put(fetchTokenBalancesFailure())
      .run()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(AppEvents.fetch_balance_error, {
      error: 'Error message',
    })
  })
})

describe(fetchTokenBalancesForAddress, () => {
  it('returns token balances for a single chain', async () => {
    jest.mocked(getDynamicConfigParams).mockReturnValueOnce({
      showBalances: [NetworkId['celo-alfajores']],
    })
    mockFetch.mockImplementation(async (_, requestInit) => {
      const body = JSON.parse((requestInit?.body as string) ?? '{}')
      return new Response(
        JSON.stringify({
          data: {
            userBalances: {
              balances: [`${body.variables.networkId} balance`],
            },
          },
        })
      )
    })
    const result = await fetchTokenBalancesForAddress('some-address')
    expect(result).toHaveLength(1),
      expect(result).toEqual(expect.arrayContaining(['celo_alfajores balance']))
  })
  it('returns token balances for multiple chains', async () => {
    jest.mocked(getDynamicConfigParams).mockReturnValueOnce({
      showBalances: [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
    })
    mockFetch.mockImplementation(async (_, requestInit) => {
      const body = JSON.parse((requestInit?.body as string) ?? '{}')
      return new Response(
        JSON.stringify({
          data: {
            userBalances: {
              balances: [`${body.variables.networkId} balance`],
            },
          },
        })
      )
    })
    const result = await fetchTokenBalancesForAddress('some-address')
    expect(result).toHaveLength(2),
      expect(result).toEqual(
        expect.arrayContaining(['celo_alfajores balance', 'ethereum_sepolia balance'])
      )
  })
})

describe(tokenAmountInSmallestUnit, () => {
  it('returns correct value', async () => {
    expect(tokenAmountInSmallestUnit(new BigNumber(10), 5)).toEqual('1000000')
  })
})

describe('watchAccountFundedOrLiquidated', () => {
  beforeEach(() => {
    // https://github.com/jfairbank/redux-saga-test-plan/issues/121
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  const balances = (firstValue: BigNumber | null, restValue: BigNumber | null) => {
    let callCount = 0
    return () => (++callCount == 1 ? firstValue : restValue)
  }

  it('dispatches the account funded event if the account is funded', async () => {
    await expectSaga(watchAccountFundedOrLiquidated)
      .provide([
        [
          select(lastKnownTokenBalancesSelector),
          dynamic(balances(new BigNumber(0), new BigNumber(10))),
        ],
      ])
      .dispatch({ type: 'TEST_ACTION_TYPE' })
      .dispatch({ type: 'TEST_ACTION_TYPE' })
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(AppEvents.account_funded)
  })

  it('dispatches the account liquidated event when the account is liquidated', async () => {
    await expectSaga(watchAccountFundedOrLiquidated)
      .provide([
        [
          select(lastKnownTokenBalancesSelector),
          dynamic(balances(new BigNumber(10), new BigNumber(0))),
        ],
      ])
      .dispatch({ type: 'TEST_ACTION_TYPE' })
      .dispatch({ type: 'TEST_ACTION_TYPE' })
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(AppEvents.account_liquidated)
  })

  it('does not dispatch the account funded event for an account restore', async () => {
    await expectSaga(watchAccountFundedOrLiquidated)
      .provide([
        [select(lastKnownTokenBalancesSelector), dynamic(balances(null, new BigNumber(10)))],
      ])
      .dispatch({ type: 'TEST_ACTION_TYPE' })
      .dispatch({ type: 'TEST_ACTION_TYPE' })
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(0)
  })
})

describe('watchFetchTokenPriceHistory', () => {
  const mockPriceHistory = [
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
  ] as TokenPriceHistoryEntry[]

  beforeEach(() => {
    mockFetch.resetMocks()
  })

  it('successfully fetches token price history when the feature gate is active', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    mockFetch.mockResponseOnce(
      JSON.stringify({
        data: mockPriceHistory,
      }),
      {
        status: 200,
      }
    )
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
          priceHistory: mockPriceHistory,
        })
      )
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `${networkConfig.blockchainApiUrl}/tokensInfo/${mockCusdTokenId}/priceHistory?startTimestamp=1700378258000&endTimestamp=1702941458000`,
      expect.any(Object)
    )
  })

  it('does not attempt to fetch token price history when feature gate is inactive', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    await expectSaga(fetchTokenPriceHistorySaga, {
      payload: {
        tokenId: mockCusdTokenId,
        startTimestamp: 1700378258000,
        endTimestamp: 1702941458000,
      },
    } as any).run()
    expect(mockFetch).toHaveBeenCalledTimes(0)
  })

  it('logs errors on failed fetches', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
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
      'tokens/saga',
      'error fetching token price history',
      `Failed to fetch price history for ${mockCusdTokenId}: 500 Internal Server Error`
    )
  })
})

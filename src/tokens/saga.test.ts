import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { dynamic, throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  fetchTokenBalancesForAddress,
  fetchTokenBalancesSaga,
  tokenAmountInSmallestUnit,
  watchAccountFundedOrLiquidated,
  getTokensInfo,
} from 'src/tokens/saga'
import { lastKnownTokenBalancesSelector } from 'src/tokens/selectors'
import {
  StoredTokenBalance,
  StoredTokenBalances,
  fetchTokenBalancesFailure,
  setTokenBalances,
} from 'src/tokens/slice'
import { walletAddressSelector } from 'src/web3/selectors'
import { createMockStore } from 'test/utils'
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
import { FetchMock } from 'jest-fetch-mock'
import Logger from 'src/utils/Logger'
import { apolloClient } from 'src/apollo'
import { getDynamicConfigParams } from 'src/statsig'
import { ApolloQueryResult } from 'apollo-client'
import { NetworkId } from 'src/transactions/types'

jest.mock('src/statsig')
jest.mock('src/apollo', () => {
  return {
    apolloClient: {
      query: jest.fn(),
    },
  }
})
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
    jest
      .mocked(apolloClient.query)
      .mockImplementation(async (payload: any): Promise<ApolloQueryResult<unknown>> => {
        return {
          data: {
            userBalances: {
              balances: [`${payload.variables.networkId} balance`],
            },
          },
        } as ApolloQueryResult<unknown>
      })
    const result = await fetchTokenBalancesForAddress('some-address')
    expect(result).toHaveLength(1),
      expect(result).toEqual(expect.arrayContaining(['celo_alfajores balance']))
  })
  it('returns token balances for multiple chains', async () => {
    jest.mocked(getDynamicConfigParams).mockReturnValueOnce({
      showBalances: [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
    })
    jest
      .mocked(apolloClient.query)
      .mockImplementation(async (payload: any): Promise<ApolloQueryResult<unknown>> => {
        return {
          data: {
            userBalances: {
              balances: [`${payload.variables.networkId} balance`],
            },
          },
        } as ApolloQueryResult<unknown>
      })
    const result = await fetchTokenBalancesForAddress('some-address')
    expect(result).toHaveLength(2),
      expect(result).toEqual(
        expect.arrayContaining(['celo_alfajores balance', 'ethereum_sepolia balance'])
      )
  })
})

describe(tokenAmountInSmallestUnit, () => {
  const mockAddress = '0xMockAddress'
  const mockTokenId = `celo-alfajores:${mockAddress}`

  it('map to token amount successfully', async () => {
    await expectSaga(tokenAmountInSmallestUnit, new BigNumber(10), mockTokenId)
      .withState(
        createMockStore({
          tokens: {
            tokenBalances: {
              [mockTokenId]: {
                address: mockAddress,
                tokenId: mockTokenId,
                networkId: NetworkId['celo-alfajores'],
                decimals: 5,
              },
            },
          },
        }).getState()
      )
      .returns('1000000')
      .run()
  })

  it('throw error if token doenst have info', async () => {
    await expect(
      expectSaga(tokenAmountInSmallestUnit, new BigNumber(10), mockTokenId)
        .withState(createMockStore({}).getState())
        .run()
    ).rejects.toThrowError(`Couldnt find token info for ID ${mockTokenId}.`)
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

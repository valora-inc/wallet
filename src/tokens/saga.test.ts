import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { dynamic, throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import {
  fetchTokenBalancesForAddress,
  fetchTokenBalancesSaga,
  tokenAmountInSmallestUnit,
  watchAccountFundedOrLiquidated,
} from 'src/tokens/saga'
import { lastKnownTokenBalancesSelector } from 'src/tokens/selectors'
import { fetchTokenBalancesFailure, setTokenBalances, StoredTokenBalances } from 'src/tokens/slice'
import { walletAddressSelector } from 'src/web3/selectors'
import { createMockStore } from 'test/utils'
import { mockAccount, mockCeurAddress, mockCusdAddress, mockTokenBalances } from 'test/values'

const poofAddress = '0x00400FcbF0816bebB94654259de7273f4A05c762'
const cUsdAddress = mockCusdAddress
const cEurAddress = mockCeurAddress

const firebaseTokenInfo: StoredTokenBalances = {
  [poofAddress]: {
    usdPrice: '0.1',
    address: poofAddress,
    symbol: 'POOF',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_POOF.png',
    name: 'Poof Governance Token',
    decimals: 18,
    balance: null,
    priceFetchedAt: mockTokenBalances[poofAddress].priceFetchedAt,
  },
  [cUsdAddress]: {
    usdPrice: '1.001',
    address: cUsdAddress,
    symbol: 'cUSD',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cUSD.png',
    name: 'Celo Dollar',
    decimals: 18,
    balance: null,
    isCoreToken: true,
    priceFetchedAt: mockTokenBalances[cUsdAddress].priceFetchedAt,
  },
  [cEurAddress]: {
    usdPrice: '1.16',
    address: cEurAddress,
    symbol: 'cEUR',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cEUR.png',
    name: 'Celo Euro',
    decimals: 18,
    balance: null,
    isCoreToken: true,
    priceFetchedAt: mockTokenBalances[cEurAddress].priceFetchedAt,
  },
}

const fetchBalancesResponse = [
  {
    tokenAddress: poofAddress,
    balance: (5 * Math.pow(10, 18)).toString(),
    decimals: '18',
  },
  {
    tokenAddress: cUsdAddress,
    balance: '0',
    decimals: '18',
  },
  // cEUR intentionally missing
]

describe(fetchTokenBalancesSaga, () => {
  it('get token info successfully', async () => {
    await expectSaga(fetchTokenBalancesSaga)
      .provide([
        [call(readOnceFromFirebase, 'tokensInfo'), firebaseTokenInfo],
        [select(walletAddressSelector), mockAccount],
        [call(fetchTokenBalancesForAddress, mockAccount), fetchBalancesResponse],
      ])
      .put(setTokenBalances(mockTokenBalances))
      .run()
  })

  it("nothing happens if there's no address in the store", async () => {
    await expectSaga(fetchTokenBalancesSaga)
      .provide([
        [select(walletAddressSelector), null],
        [call(readOnceFromFirebase, 'tokensInfo'), firebaseTokenInfo],
        [call(fetchTokenBalancesForAddress, mockAccount), fetchBalancesResponse],
      ])
      .not.call(readOnceFromFirebase, 'tokensInfo')
      .not.put(setTokenBalances(mockTokenBalances))
      .run()
  })

  it("fires an event if there's an error", async () => {
    await expectSaga(fetchTokenBalancesSaga)
      .provide([
        [call(readOnceFromFirebase, 'tokensInfo'), firebaseTokenInfo],
        [select(walletAddressSelector), mockAccount],
        [call(fetchTokenBalancesForAddress, mockAccount), throwError(new Error('Error message'))],
      ])
      .not.put(setTokenBalances(mockTokenBalances))
      .put(fetchTokenBalancesFailure())
      .run()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(AppEvents.fetch_balance_error, {
      error: 'Error message',
    })
  })
})

describe(tokenAmountInSmallestUnit, () => {
  const mockAddress = '0xMockAddress'

  it('map to token amount successfully', async () => {
    await expectSaga(tokenAmountInSmallestUnit, new BigNumber(10), mockAddress)
      .withState(
        createMockStore({
          tokens: {
            tokenBalances: {
              [mockAddress]: {
                address: mockAddress,
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
      expectSaga(tokenAmountInSmallestUnit, new BigNumber(10), mockAddress)
        .withState(createMockStore({}).getState())
        .run()
    ).rejects.toThrowError(`Couldnt find token info for address ${mockAddress}.`)
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

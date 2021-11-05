import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import { setTokenBalances, StoredTokenBalances } from 'src/tokens/reducer'
import { fetchTokenBalances, importTokenInfo, tokenAmountInSmallestUnit } from 'src/tokens/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { createMockStore } from 'test/utils'
import { mockAccount, mockTokenBalances } from 'test/values'

const poofAddress = '0x00400FcbF0816bebB94654259de7273f4A05c762'
const cUsdAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'

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
  },
  '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F': {
    usdPrice: '1.16',
    address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
    symbol: 'cEUR',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cEUR.png',
    name: 'Celo Euro',
    decimals: 18,
    balance: null,
  },
}

const blockscoutResponse = [
  {
    contractAddress: poofAddress,
    balance: (5 * Math.pow(10, 18)).toString(),
    decimals: '18',
  },
  {
    contractAddress: cUsdAddress,
    balance: '0',
    decimals: '18',
  },
  // cEUR intentionally missing
]

describe(importTokenInfo, () => {
  it('get token info successfully', async () => {
    await expectSaga(importTokenInfo)
      .provide([
        [call(readOnceFromFirebase, 'tokensInfo'), firebaseTokenInfo],
        [select(walletAddressSelector), mockAccount],
        [call(fetchTokenBalances, mockAccount), blockscoutResponse],
      ])
      .put(setTokenBalances(mockTokenBalances))
      .run()
  })

  it("fires an event if there's an error", async () => {
    await expectSaga(importTokenInfo)
      .provide([
        [call(readOnceFromFirebase, 'tokensInfo'), firebaseTokenInfo],
        [select(walletAddressSelector), mockAccount],
        [call(fetchTokenBalances, mockAccount), throwError(new Error('Error message'))],
      ])
      .not.put(setTokenBalances(mockTokenBalances))
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

import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import { setTokenBalances, StoredTokenBalance } from 'src/tokens/reducer'
import { getERC20TokenBalance, importTokenInfo } from 'src/tokens/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockAccount, mockTokenBalances, mockTokenBalances2 } from 'test/values'

const firebaseTokenInfo: StoredTokenBalance[] = [
  {
    usdPrice: '0.1',
    address: '0x00400FcbF0816bebB94654259de7273f4A05c762',
    symbol: 'POOF',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_POOF.png',
    name: 'Poof Governance Token',
    decimals: 18,
    balance: null,
  },
  {
    usdPrice: '1.16',
    address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
    symbol: 'cEUR',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cEUR.png',
    name: 'Celo Euro',
    decimals: 18,
    balance: null,
  },
]

describe(importTokenInfo, () => {
  it('get token info successfully', async () => {
    await expectSaga(importTokenInfo)
      .provide([
        [call(readOnceFromFirebase, 'tokensInfo'), firebaseTokenInfo],
        [select(walletAddressSelector), mockAccount],
        [call(getERC20TokenBalance, firebaseTokenInfo[0], mockAccount), 5000000000000000000],
        [call(getERC20TokenBalance, firebaseTokenInfo[1], mockAccount), 0],
      ])
      .put(setTokenBalances(mockTokenBalances))
      .run()
  })

  it('gets token info successfully when fetching one balance fails', async () => {
    await expectSaga(importTokenInfo)
      .provide([
        [call(readOnceFromFirebase, 'tokensInfo'), firebaseTokenInfo],
        [select(walletAddressSelector), mockAccount],
        [call(getERC20TokenBalance, firebaseTokenInfo[0], mockAccount), 5000000000000000000],
        [call(getERC20TokenBalance, firebaseTokenInfo[1], mockAccount), null],
      ])
      .put(setTokenBalances(mockTokenBalances2))
      .run()
  })
})

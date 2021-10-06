import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import { setTokenBalances } from 'src/tokens/reducer'
import { importTokenInfo } from 'src/tokens/saga'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { currentAccountSelector } from 'src/web3/selectors'
import { mockAccount } from 'test/values'
import * as erc20 from './IERC20.json'

const firebaseTokenInfo = [
  {
    usdPrice: 0.1,
    address: '0x00400FcbF0816bebB94654259de7273f4A05c762',
    symbol: 'POOF',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_POOF.png',
    name: 'Poof Governance Token',
    decimals: 18,
  },
  {
    usdPrice: 1.16,
    address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
    symbol: 'cEUR',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cEUR.png',
    name: 'Celo Euro',
    decimals: 18,
  },
]
const tokenBalances = {
  '0x00400FcbF0816bebB94654259de7273f4A05c762': {
    usdPrice: 0.1,
    address: '0x00400FcbF0816bebB94654259de7273f4A05c762',
    symbol: 'POOF',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_POOF.png',
    name: 'Poof Governance Token',
    decimals: 18,
    balance: 0,
  },
  '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F': {
    usdPrice: 1.16,
    address: '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F',
    symbol: 'cEUR',
    imageUrl:
      'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_cEUR.png',
    name: 'Celo Euro',
    decimals: 18,
    balance: 0,
  },
}

describe(importTokenInfo, () => {
  it('get token info successfully', async () => {
    const contractKit = await getContractKitAsync()
    const contractPOOF = new contractKit.web3.eth.Contract(
      erc20.abi,
      '0x00400FcbF0816bebB94654259de7273f4A05c762'
    )
    const contractcEUR = new contractKit.web3.eth.Contract(
      erc20.abi,
      '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F'
    )
    await expectSaga(importTokenInfo)
      .provide([
        [call(readOnceFromFirebase, 'tokensInfo'), firebaseTokenInfo],
        [call(getContractKit), contractKit],
        [select(currentAccountSelector), mockAccount],
        // [call(fetchTokenBalance, contractKit, mockAccount, firebaseTokenInfo[0]), 0],
        // [call(fetchTokenBalance, contractKit, mockAccount, firebaseTokenInfo[1]), 0]
        [call(contractPOOF.methods.balanceOf(mockAccount).call), 0],
        [call(contractcEUR.methods.balanceOf(mockAccount).call), 0],
      ])
      .put(setTokenBalances(tokenBalances))
      .run()
  })
})

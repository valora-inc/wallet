import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { SupportedActions } from 'src/walletConnect/constants'
import { handleRequest } from 'src/walletConnect/request'
import { getWallet } from 'src/web3/contracts'
import { unlockAccount } from 'src/web3/saga'
import { createMockStore } from 'test/utils'
import { mockWallet } from 'test/values'

const signTransactionRequest = {
  method: SupportedActions.eth_signTransaction,
  params: [{ from: '0xTEST' }],
}
const personalSignRequest = {
  method: SupportedActions.personal_sign,
  params: ['Some message', '0xdeadbeef'],
}
const signTypedDataRequest = {
  method: SupportedActions.eth_signTypedData,
  params: ['0xdeadbeef', JSON.stringify({ message: 'Some typed data' })],
}
const signTypedDataV4Request = {
  method: SupportedActions.eth_signTypedData_v4,
  params: ['0xdeadbeef', JSON.stringify({ message: 'Some typed data' })],
}

describe(handleRequest, () => {
  it('unlocks the wallet address when a MTW address is set', async () => {
    const state = createMockStore({ web3: { account: '0xWALLET', mtwAddress: '0xMTW' } }).getState()
    await expectSaga(handleRequest, signTransactionRequest)
      .provide([[call(getWallet), mockWallet]])
      .withState(state)
      .call(unlockAccount, '0xwallet')
      .run()
  })

  it('unlocks the wallet address when a MTW address is NOT set', async () => {
    const state = createMockStore({
      web3: { account: '0xWALLET', mtwAddress: undefined },
    }).getState()
    await expectSaga(handleRequest, signTransactionRequest)
      .provide([[call(getWallet), mockWallet]])
      .withState(state)
      .call(unlockAccount, '0xwallet')
      .run()
  })

  it('supports personal_sign', async () => {
    const state = createMockStore({
      web3: { account: '0xWALLET', mtwAddress: undefined },
    }).getState()
    await expectSaga(handleRequest, personalSignRequest)
      .provide([[call(getWallet), mockWallet]])
      .withState(state)
      .call(unlockAccount, '0xwallet')
      .call([mockWallet, 'signPersonalMessage'], '0xwallet', 'Some message')
      .run()
  })

  it('supports eth_signTypedData', async () => {
    const state = createMockStore({
      web3: { account: '0xWALLET', mtwAddress: undefined },
    }).getState()
    await expectSaga(handleRequest, signTypedDataRequest)
      .provide([[call(getWallet), mockWallet]])
      .withState(state)
      .call(unlockAccount, '0xwallet')
      .call([mockWallet, 'signTypedData'], '0xwallet', { message: 'Some typed data' })
      .run()
  })

  it('supports eth_signTypedData_v4', async () => {
    const state = createMockStore({
      web3: { account: '0xWALLET', mtwAddress: undefined },
    }).getState()
    await expectSaga(handleRequest, signTypedDataV4Request)
      .provide([[call(getWallet), mockWallet]])
      .withState(state)
      .call(unlockAccount, '0xwallet')
      .call([mockWallet, 'signTypedData'], '0xwallet', { message: 'Some typed data' })
      .run()
  })

  describe('eth_signTransaction', () => {
    it('normalizes the input transaction', async () => {
      const state = createMockStore({
        web3: { account: '0xWALLET', mtwAddress: undefined },
      }).getState()

      // This check ensures chainId, feeCurrency, gas, gasPrice and nonce are added if not set
      await expectSaga(handleRequest, {
        method: SupportedActions.eth_signTransaction,
        params: [{ from: '0xTEST', data: '0xABC' }],
      })
        .provide([[call(getWallet), mockWallet]])
        .withState(state)
        .call(unlockAccount, '0xwallet')
        .call([mockWallet, 'signTransaction'], {
          from: '0xTEST',
          data: '0xABC',
          feeCurrency: 1000,
          gas: 1000000,
          gasPrice: 3,
          chainId: 44787,
          nonce: 7,
        })
        .run()

      // This check ensures gas and gasPrice are updated when feeCurrency is not set
      await expectSaga(handleRequest, {
        method: SupportedActions.eth_signTransaction,
        params: [{ from: '0xTEST', data: '0xABC', gas: 1, gasPrice: 2, nonce: 3 }],
      })
        .provide([[call(getWallet), mockWallet]])
        .withState(state)
        .call(unlockAccount, '0xwallet')
        .call([mockWallet, 'signTransaction'], {
          from: '0xTEST',
          data: '0xABC',
          feeCurrency: 1000,
          gas: 1000000,
          gasPrice: 3,
          chainId: 44787,
          nonce: 3,
        })
        .run()

      // This check ensures chainId, feeCurrency, gas, gasPrice and nonce are kept when provided
      await expectSaga(handleRequest, {
        method: SupportedActions.eth_signTransaction,
        params: [
          {
            from: '0xTEST',
            data: '0xABC',
            chainId: 45000,
            feeCurrency: 2000,
            gas: 1,
            gasPrice: 2,
            nonce: 3,
          },
        ],
      })
        .provide([[call(getWallet), mockWallet]])
        .withState(state)
        .call(unlockAccount, '0xwallet')
        .call([mockWallet, 'signTransaction'], {
          from: '0xTEST',
          data: '0xABC',
          feeCurrency: 2000,
          gas: 1,
          gasPrice: 2,
          chainId: 45000,
          nonce: 3,
        })
        .run()
    })
  })
})

import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { SupportedActions } from 'src/walletConnect/constants'
import { handleRequest } from 'src/walletConnect/request'
import { getWallet } from 'src/web3/contracts'
import { unlockAccount } from 'src/web3/saga'
import { createMockStore } from 'test/utils'
import { mockWallet } from 'test/values'

const signTransactionRequest = { method: SupportedActions.eth_signTransaction, params: [] }
const personalSignRequest = {
  method: SupportedActions.personal_sign,
  params: ['Some message', '0xdeadbeef'],
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
})

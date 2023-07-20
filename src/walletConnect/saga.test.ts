import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { walletConnectEnabledSelector } from 'src/app/selectors'
import { initialiseWalletConnect } from 'src/walletConnect/saga'
import { initialiseWalletConnectV2 } from 'src/walletConnect/v2/saga'

// TODO: use a real connection string
const v2ConnectionString =
  'wc:79a02f869d0f921e435a5e0643304548ebfa4a0430f9c66fe8b1a9254db7ef77@2?controller=false&publicKey=f661b0a9316a4ce0b6892bdce42bea0f45037f2c1bee9e118a3a4bc868a32a39&relay={"protocol":"waku"}'

describe('WalletConnect saga', () => {
  describe('initialiseWalletConnect', () => {
    const origin = WalletConnectPairingOrigin.Deeplink

    it('initializes v2 if enabled', async () => {
      await expectSaga(initialiseWalletConnect, v2ConnectionString, origin)
        .provide([
          [select(walletConnectEnabledSelector), { v1: true, v2: true }],
          [call(initialiseWalletConnectV2, v2ConnectionString, origin), {}],
        ])
        .call(initialiseWalletConnectV2, v2ConnectionString, origin)
        .run()
    })

    it('doesnt initialize v2 if disabled', async () => {
      await expectSaga(initialiseWalletConnect, v2ConnectionString, origin)
        .provide([[select(walletConnectEnabledSelector), { v1: true, v2: false }]])
        .not.call(initialiseWalletConnectV2, v2ConnectionString, origin)
        .run()
    })
  })
})

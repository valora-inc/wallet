import { expectSaga } from 'redux-saga-test-plan'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import { initialiseWalletConnect, isWalletConnectEnabled } from 'src/walletConnect/saga'
import { initialiseWalletConnectV1 } from 'src/walletConnect/v1/saga'
import { createMockStore } from 'test/utils'

const v1ConnectionString =
  'wc:79a02f869d0f921e435a5e0643304548ebfa4a0430f9c66fe8b1a9254db7ef77@1?controller=false&publicKey=f661b0a9316a4ce0b6892bdce42bea0f45037f2c1bee9e118a3a4bc868a32a39&relay={"protocol":"waku"}'
const v2ConnectionString =
  'wc:79a02f869d0f921e435a5e0643304548ebfa4a0430f9c66fe8b1a9254db7ef77@2?controller=false&publicKey=f661b0a9316a4ce0b6892bdce42bea0f45037f2c1bee9e118a3a4bc868a32a39&relay={"protocol":"waku"}'

const v1EnabledState = createMockStore({
  app: { walletConnectV1Enabled: true },
}).getState()
const v1DisabledState = createMockStore({
  app: { walletConnectV1Enabled: false },
}).getState()

describe('WalletConnect saga', () => {
  describe('isWalletConnectEnabled', () => {
    it('returns enabled for v1 link if enabled', async () => {
      await expectSaga(isWalletConnectEnabled, v1ConnectionString)
        .withState(v1EnabledState)
        .returns(true)
        .run()
    })

    it('returns disabled for v1 links if disabled', async () => {
      await expectSaga(isWalletConnectEnabled, v1ConnectionString)
        .withState(v1DisabledState)
        .returns(false)
        .run()
    })

    it('returns disabled for v2 link if enabled', async () => {
      await expectSaga(isWalletConnectEnabled, v2ConnectionString)
        .withState(v1EnabledState)
        .returns(false)
        .run()
    })

    it('returns disabled for v2 links if disabled', async () => {
      await expectSaga(isWalletConnectEnabled, v2ConnectionString)
        .withState(v1DisabledState)
        .returns(false)
        .run()
    })
  })

  describe('initialiseWalletConnect', () => {
    const origin = WalletConnectPairingOrigin.Deeplink

    it('initializes v1 if enabled', async () => {
      await expectSaga(initialiseWalletConnect, v1ConnectionString, origin)
        .withState(v1EnabledState)
        .call(initialiseWalletConnectV1, v1ConnectionString, origin)
        .run()
    })

    it("doesn't initialize v1 if disabled", async () => {
      await expectSaga(initialiseWalletConnect, v1ConnectionString, origin)
        .withState(v1DisabledState)
        .not.call(initialiseWalletConnectV1, v1ConnectionString, origin)
        .run()
    })
  })
})

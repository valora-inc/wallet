import { quickOnboarding } from './utils/utils'
import WalletConnectV1 from './usecases/WalletConnectV1'

describe('Given Wallet Connect', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  //TODO: Investigate why on Android WC accept screen does not display with detox
  device.getPlatform() === 'ios'
    ? describe('When V1', WalletConnectV1)
    : describe.skip('When V1', WalletConnectV1)
})

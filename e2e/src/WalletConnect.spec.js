import WalletConnectV1 from './usecases/WalletConnectV1'
import WalletConnectV2 from './usecases/WalletConnectV2'
import { quickOnboarding } from './utils/utils'

describe('Given Wallet Connect', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('When V1', WalletConnectV1)
  // Skip WalletConnect V2 Until supported
  describe.skip('When V2', WalletConnectV2)
})

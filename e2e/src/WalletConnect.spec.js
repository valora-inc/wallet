import WalletConnectV2 from './usecases/WalletConnectV2'
import { quickOnboarding } from './utils/utils'

xdescribe('Given Wallet Connect', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('When V2', WalletConnectV2)
})

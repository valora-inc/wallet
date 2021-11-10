import { quickOnboarding } from './utils/utils'
import WalletConnectV1 from './usecases/WalletConnectV1'

describe('Given Wallet Connect', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('When V1', WalletConnectV1)
})

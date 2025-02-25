import WalletConnect from './usecases/WalletConnect'
import { quickOnboarding } from './utils/utils'

describe('Given Dapp Connection', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('When WalletConnect', WalletConnect)
})

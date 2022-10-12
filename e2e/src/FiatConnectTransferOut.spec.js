import { quickOnboarding } from './utils/utils'
import { fiatConnectTransferOut } from './usecases/FiatConnectTransferOut'

describe('FiatConnect Transfer Out', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('Non KYC', fiatConnectTransferOut)
})

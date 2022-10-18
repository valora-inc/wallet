import { fiatConnectNonKycTransferOut } from './usecases/FiatConnectTransferOut'
import { quickOnboarding } from './utils/utils'

describe('FiatConnect Transfer Out', () => {
  beforeEach(async () => {
    await quickOnboarding()
  })
  // deliberately not doing onboarding in beforeEach (since we sometimes want to re-use an account for returning user flow testing)
  describe('Non KYC', fiatConnectNonKycTransferOut)
})

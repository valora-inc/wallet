import { fiatConnectNonKycTransferOut } from './usecases/FiatConnectTransferOut'

describe('FiatConnect Transfer Out', () => {
  // deliberately not doing onboarding in beforeEach (since we sometimes want to re-use an account for returning user flow testing)
  describe('Non KYC', fiatConnectNonKycTransferOut)
})

import {
  fiatConnectNonKycTransferOut,
  fiatConnectKycTransferOut,
} from './usecases/FiatConnectTransferOut'

describe('FiatConnect Transfer Out', () => {
  // deliberately not doing onboarding in beforeEach, since we'll want to re-use accounts, use fresh accounts, etc for these tests
  //describe('Non KYC', fiatConnectNonKycTransferOut)
  describe('KYC', fiatConnectKycTransferOut)
})

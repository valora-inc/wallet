import {
  fiatConnectNonKycTransferOut,
  fiatConnectKycTransferOut,
} from './usecases/FiatConnectTransferOut'
import { MOCK_PROVIDER_BASE_URL, MOCK_PROVIDER_API_KEY } from 'react-native-dotenv'
import { launchApp } from './utils/retries'

describe(':ios: FiatConnect Transfer Out', () => {
  // deliberately not doing onboarding in beforeEach, since we'll want to re-use accounts, use fresh accounts, etc for these tests
  beforeEach(async () => {
    // uninstall and reinstall to obtain a fresh account
    await device.uninstallApp()
    await device.installApp()
    await launchApp({
      newInstance: false,
      permissions: { notifications: 'YES', contacts: 'YES', camera: 'YES' },
    })
  })

  // disable test for android until we fix the bottom sheet issue
  describe('Non KYC', fiatConnectNonKycTransferOut)

  // KYC test needs to be on iOS and needs Mock Provider info
  if (MOCK_PROVIDER_BASE_URL && MOCK_PROVIDER_API_KEY) {
    describe('KYC', fiatConnectKycTransferOut)
  }
})

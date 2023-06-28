import {
  fiatConnectNonKycTransferOut,
  fiatConnectKycTransferOut,
} from './usecases/FiatConnectTransferOut'
import { MOCK_PROVIDER_BASE_URL, MOCK_PROVIDER_API_KEY } from 'react-native-dotenv'
import { launchApp } from './utils/retries'

describe('FiatConnect Transfer Out', () => {
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

  const platform = device.getPlatform()
  // KYC test needs to be on iOS and needs Mock Provider info, non KYC test
  // temporarily skipped for android. Should be moved out once root cause is fixed
  if (platform == 'ios' && MOCK_PROVIDER_BASE_URL && MOCK_PROVIDER_API_KEY) {
    describe('Non KYC', fiatConnectNonKycTransferOut)
    describe('KYC', fiatConnectKycTransferOut)
  }
})

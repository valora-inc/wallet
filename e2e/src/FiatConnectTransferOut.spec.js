import {
  fiatConnectNonKycTransferOut,
  fiatConnectKycTransferOut,
} from './usecases/FiatConnectTransferOut'
import { launchApp } from './utils/retries'

describe('FiatConnect Transfer Out', () => {
  // deliberately not doing onboarding in beforeEach, since we'll want to re-use accounts, use fresh accounts, etc for these tests
  beforeEach(async () => {
    await device.uninstallApp()
    await device.installApp()
    await launchApp({
      newInstance: false,
      permissions: { notifications: 'YES', contacts: 'YES', camera: 'YES' },
    })
  })
  describe('Non KYC', fiatConnectNonKycTransferOut)
  describe('KYC', fiatConnectKycTransferOut)
})

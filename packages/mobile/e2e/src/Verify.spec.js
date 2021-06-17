import dismissBanners from './utils/banners'
import { receiveSms } from './utils/twilio'
import NewAccountPhoneVerification from './usecases/NewAccountPhoneVerification'

describe('Phone Verification', () => {
  describe('New Account', NewAccountPhoneVerification)
})

import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'
import NewAccountOnboarding from './usecases/NewAccountOnboarding'

describe('Account Setup', () => {
  describe('New Account #BVT', NewAccountOnboarding)
  describe('Restore #BVT', RestoreAccountOnboarding)
})

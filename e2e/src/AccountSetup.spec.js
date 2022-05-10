import NewAccountOnboarding from './usecases/NewAccountOnboarding'
import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'

describe('Account Setup', () => {
  describe('New Account', NewAccountOnboarding)
  describe('Restore', RestoreAccountOnboarding)
})

import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'
import NewAccountOnboarding from './usecases/NewAccountOnboarding'

describe('Account Setup', () => {
  describe('New Account', NewAccountOnboarding)
  describe('Restore', RestoreAccountOnboarding)
})

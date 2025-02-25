import NewAccountOnboarding from './usecases/NewAccountOnboarding'
import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'

xdescribe('Account Setup', () => {
  describe('New Account', NewAccountOnboarding)
  describe('Restore', RestoreAccountOnboarding)
})

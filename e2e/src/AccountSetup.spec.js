import ChooseYourAdventure from './usecases/ChooseYourAdventure'
import NewAccountOnboarding from './usecases/NewAccountOnboarding'
import NewAccountOnboardingDrawer from './usecases/NewAccountOnboardingDrawer'
import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'

describe('Account Setup', () => {
  describe('New Account', NewAccountOnboarding)
  describe('New Account Drawer', NewAccountOnboardingDrawer)
  describe('Restore', RestoreAccountOnboarding)
  describe('Choose Your Adventure', ChooseYourAdventure)
})

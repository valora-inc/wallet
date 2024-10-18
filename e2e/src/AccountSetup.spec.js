import ChooseYourAdventure from './usecases/ChooseYourAdventure'
import NewAccountOnboarding from './usecases/NewAccountOnboarding'
import RestoreAccountOnboarding from './usecases/RestoreAccountOnboarding'

describe('Account Setup', () => {
  describe('New Account', NewAccountOnboarding)
  describe('Restore', RestoreAccountOnboarding)
  describe('Choose Your Adventure', ChooseYourAdventure)
})

import CeloEducation from './usecases/CeloEducation'
import { quickOnboarding } from './utils/utils'

describe('Celo page', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('celo education', CeloEducation)
})

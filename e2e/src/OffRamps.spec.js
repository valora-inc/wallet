import offRamps from './usecases/OffRamps'
import { quickOnboarding } from './utils/utils'

describe('Ramps', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('Given Cash Out', offRamps)
})

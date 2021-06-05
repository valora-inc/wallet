import offRamps from './usecases/OnRamps'
import { quickOnboarding } from './utils/utils'

describe('Ramps', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('Given Off Ramp', offRamps)
})

import onRamps from './usecases/OnRamps'
import { quickOnboarding } from './utils/utils'

describe('Ramps', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('Given Cash In', onRamps)
})

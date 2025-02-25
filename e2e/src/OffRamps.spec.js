import offRamps from './usecases/OffRamps'
import { quickOnboarding } from './utils/utils'

xdescribe('Ramps', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('Given Cash Out', offRamps)
})

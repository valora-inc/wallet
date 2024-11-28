import HomeFeed from './usecases/HomeFeed'
import { quickOnboarding } from './utils/utils'

describe('Home feed', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('when loaded', HomeFeed)
})

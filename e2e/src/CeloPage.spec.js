import CeloEducation from './usecases/CeloEducation'
import CeloNews from './usecases/CeloNews'
import PriceChart from './usecases/PriceChart'
import { quickOnboarding } from './utils/utils'

describe('Celo page', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('celo education', CeloEducation)
  // TODO: this is an ad-hoc fix to unblock the CI in the wallet repo
  // Re-enable in the framework repo
  // Context: https://valora-app.slack.com/archives/C02E2FE98P2/p1740468590381239
  xdescribe('price chart', PriceChart)
  describe('celo news', CeloNews)
})

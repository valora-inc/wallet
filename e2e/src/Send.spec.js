import SecureSend from './usecases/SecureSend'
import Send from './usecases/Send'
import { SAMPLE_BACKUP_KEY, SAMPLE_BACKUP_KEY_12_WORDS } from './utils/consts'
import { quickOnboarding } from './utils/utils'

describe.each([
  // overrides are setup for the corresponding addresses on the feature gate
  { client: 'contractkit', phrase: SAMPLE_BACKUP_KEY },
  { client: 'viem', phrase: SAMPLE_BACKUP_KEY_12_WORDS },
])('Given', ({ phrase }) => {
  beforeAll(async () => {
    await quickOnboarding(phrase)
  })

  describe('Send (with $client)', Send)
  // TODO: unskip this test if we enable CPV in CI
  describe.skip('SecureSend cUSD', SecureSend)
})

import { filterByFeatureFlags } from 'src/fiatExchanges/utils'
import { getFeatureGate } from 'src/statsig'
import { mockProviders } from 'test/values'

jest.mock('src/statsig')

describe('filterByFeatureFlags', () => {
  it('returns undefined if no providers are passed in', () => {
    const filterdProviders = filterByFeatureFlags(undefined)
    expect(filterdProviders).toBeUndefined()
  })
  it('filters out bitmama widget if feature flag is false', () => {
    ;(getFeatureGate as jest.Mock).mockImplementation(() => false)
    const filterdProviders = filterByFeatureFlags(mockProviders)
    expect(filterdProviders).toEqual(
      mockProviders.filter((provider) => provider.name !== 'Bitmama')
    )
  })
  it('does not filter out bitmama widget if feature flag is true', () => {
    ;(getFeatureGate as jest.Mock).mockImplementation(() => true)
    const filterdProviders = filterByFeatureFlags(mockProviders)
    expect(filterdProviders).toEqual(mockProviders)
  })
})

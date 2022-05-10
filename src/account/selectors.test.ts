import { defaultCountryCodeSelector } from 'src/account/selectors'
import { getMockStoreData } from 'test/utils'

jest.mock('react-native-localize', () => ({
  getCountry: () => 'IR',
}))

describe(defaultCountryCodeSelector, () => {
  it('does not return a sanctioned country', () => {
    expect(
      defaultCountryCodeSelector(
        getMockStoreData({
          account: { defaultCountryCode: null },
        })
      )
    ).toBe(null)
  })
})

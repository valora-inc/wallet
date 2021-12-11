import { getProviderAvailability } from './providerAvailability'

describe('providerAvailability', () => {
  describe('ramp', () => {
    it.each([
      'AZ',
      'AR',
      'CA',
      'CO',
      'DE',
      'DC',
      'GA',
      'ID',
      'IL',
      'IN',
      'IA',
      'KS',
      'KY',
      'ME',
      'MA',
      'MD',
      'MI',
      'MN',
      'MS',
      'MO',
      'MT',
      'NE',
      'NH',
      'NC',
      'ND',
      'OH',
      'OK',
      'PA',
      'RI',
      'SC',
      'TN',
      'TX',
      'UT',
      'VA',
      'WA',
      'WV',
      'WI',
      'WY',
    ])('ramp supports cash-ins from US state: %s', (state) => {
      const { RAMP_RESTRICTED } = getProviderAvailability({
        countryCodeAlpha2: 'US',
        region: state,
        ipAddress: null,
      })
      expect(RAMP_RESTRICTED).toBeFalsy()
    })
    it.each([
      'AL',
      'AK',
      'CT',
      'FL',
      'HI',
      'LA',
      'NV',
      'NJ',
      'NM',
      'NY',
      'OR',
      'SD',
      'VT',
      'AS',
      'GU',
      'MP',
      'PR',
      'UM',
      'VI',
    ])('ramp does NOT support cash-ins from US state: %s', (state) => {
      const { RAMP_RESTRICTED } = getProviderAvailability({
        countryCodeAlpha2: 'US',
        region: state,
        ipAddress: null,
      })
      expect(RAMP_RESTRICTED).toBeTruthy()
    })
  })
})

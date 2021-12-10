import { getProviderAvailability } from './providerAvailability'

describe('providerAvailability', () => {
  describe('ramp', () => {
    it.each([
      'AK',
      'AL',
      'AR',
      'AZ',
      'CA',
      'CO',
      'CT',
      'DE',
      'FL',
      'GA',
      'HI',
      'IA',
      'ID',
      'IL',
      'IN',
      'KS',
      'KY',
      'LA',
      'MA',
      'MD',
      'ME',
      'MH',
      'MI',
      'MN',
      'MO',
      'MS',
      'MT',
      'NC',
      'ND',
      'NE',
      'NH',
      'NJ',
      'NM',
      'NV',
      'OH',
      'OK',
      'OR',
      'PA',
      'PW',
      'RI',
      'SC',
      'SD',
      'TN',
      'UT',
      'VA',
      'VT',
      'WA',
      'WI',
      'WV',
      'WY',
    ])('ramp supports cash-ins from US state: %s', (state) => {
      const { RAMP_RESTRICTED } = getProviderAvailability({
        countryCodeAlpha2: 'US',
        region: state,
        ipAddress: null,
      })
      expect(RAMP_RESTRICTED).toBeFalsy()
    })
    it.each(['TX', 'NY'])('ramp does NOT support cash-ins from US state: %s', (state) => {
      const { RAMP_RESTRICTED } = getProviderAvailability({
        countryCodeAlpha2: 'US',
        region: state,
        ipAddress: null,
      })
      expect(RAMP_RESTRICTED).toBeTruthy()
    })
  })
})

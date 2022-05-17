import 'react-native'
import { getCountryFeaturesSelector } from 'src/utils/countryFeatures'
import { getMockStoreData } from 'test/utils'

describe(getCountryFeaturesSelector, () => {
  it('returns the appropriate features for US accounts', () => {
    const state = getMockStoreData({
      networkInfo: {
        userLocationData: {
          countryCodeAlpha2: 'US',
          region: null,
          ipAddress: null,
        },
      },
    })

    expect(getCountryFeaturesSelector(state)).toMatchInlineSnapshot(`
      Object {
        "IS_IN_EUROPE": false,
        "RESTRICTED_CP_DOTO": false,
        "SANCTIONED_COUNTRY": false,
      }
    `)
  })

  it('returns the appropriate features for PH accounts', () => {
    const state = getMockStoreData({
      networkInfo: {
        userLocationData: {
          countryCodeAlpha2: 'PH',
          region: null,
          ipAddress: null,
        },
      },
    })

    expect(getCountryFeaturesSelector(state)).toMatchInlineSnapshot(`
      Object {
        "IS_IN_EUROPE": false,
        "RESTRICTED_CP_DOTO": true,
        "SANCTIONED_COUNTRY": false,
      }
    `)
  })

  it('returns the appropriate features for JP accounts', () => {
    const state = getMockStoreData({
      networkInfo: {
        userLocationData: {
          countryCodeAlpha2: 'JP',
          region: null,
          ipAddress: null,
        },
      },
    })

    expect(getCountryFeaturesSelector(state)).toMatchInlineSnapshot(`
      Object {
        "IS_IN_EUROPE": false,
        "RESTRICTED_CP_DOTO": true,
        "SANCTIONED_COUNTRY": false,
      }
    `)
  })

  it('returns the appropriate features for CU accounts', () => {
    const state = getMockStoreData({
      networkInfo: {
        userLocationData: {
          countryCodeAlpha2: 'CU',
          region: null,
          ipAddress: null,
        },
      },
    })

    expect(getCountryFeaturesSelector(state)).toMatchInlineSnapshot(`
      Object {
        "IS_IN_EUROPE": false,
        "RESTRICTED_CP_DOTO": false,
        "SANCTIONED_COUNTRY": true,
      }
    `)
  })

  it('returns the appropriate features for BR accounts', () => {
    const state = getMockStoreData({
      networkInfo: {
        userLocationData: {
          countryCodeAlpha2: 'BR',
          region: null,
          ipAddress: null,
        },
      },
    })

    expect(getCountryFeaturesSelector(state)).toMatchInlineSnapshot(`
      Object {
        "IS_IN_EUROPE": false,
        "RESTRICTED_CP_DOTO": false,
        "SANCTIONED_COUNTRY": false,
      }
    `)
  })
})

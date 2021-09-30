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
        "FIAT_SPEND_ENABLED": false,
        "RESTRICTED_CP_DOTO": false,
        "SANCTIONED_COUNTRY": false,
        "USE_CEUR": false,
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
        "FIAT_SPEND_ENABLED": true,
        "RESTRICTED_CP_DOTO": true,
        "SANCTIONED_COUNTRY": false,
        "USE_CEUR": false,
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
        "FIAT_SPEND_ENABLED": false,
        "RESTRICTED_CP_DOTO": true,
        "SANCTIONED_COUNTRY": false,
        "USE_CEUR": false,
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
        "FIAT_SPEND_ENABLED": false,
        "RESTRICTED_CP_DOTO": false,
        "SANCTIONED_COUNTRY": true,
        "USE_CEUR": false,
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
        "FIAT_SPEND_ENABLED": false,
        "RESTRICTED_CP_DOTO": false,
        "SANCTIONED_COUNTRY": false,
        "USE_CEUR": false,
      }
    `)
  })
})

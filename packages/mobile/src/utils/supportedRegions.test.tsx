import 'react-native'
import { isUserRegionSupportedByFinclusive } from 'src/utils/supportedRegions'

const unsupportedRegions = ['NY', 'TX']
describe('finclusive supported regions helper', () => {
  it('throws error if the address input is null', () => {
    const mockAddressObject = null

    expect(() => {
      isUserRegionSupportedByFinclusive(mockAddressObject, unsupportedRegions)
    }).toThrowError('Persona inquiry attributes missing address info')
  })

  it('returns false if country code is not in us', () => {
    const mockAddressObject = {
      street1: ' 3789 Carling Avenue',
      street2: null,
      city: 'Ottawa',
      subdivision: 'Ontario',
      postalCode: 'K1Z 7B5',
      countryCode: 'CAN',
      subdivisionAbbr: 'OT',
    }

    expect(isUserRegionSupportedByFinclusive(mockAddressObject, unsupportedRegions)).toBeFalsy()
  })

  it('returns false if state is not supported by finclusive', () => {
    const mockAddressObject = {
      street1: '8669 Ketch Harbour Street',
      street2: null,
      city: 'Brooklyn',
      subdivision: 'New York',
      postalCode: '11212',
      countryCode: 'US',
      subdivisionAbbr: 'NY',
    }

    expect(isUserRegionSupportedByFinclusive(mockAddressObject, unsupportedRegions)).toBeFalsy()
  })

  it('returns true if state is supported by finclusive', () => {
    const mockAddressObject = {
      street1: '4067 Center Avenue',
      street2: null,
      city: 'Fresno',
      subdivision: 'California',
      postalCode: '93711',
      countryCode: 'US',
      subdivisionAbbr: 'CA',
    }

    expect(isUserRegionSupportedByFinclusive(mockAddressObject, unsupportedRegions)).toBeTruthy()
  })
})

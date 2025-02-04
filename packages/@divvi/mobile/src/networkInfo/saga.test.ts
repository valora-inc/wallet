import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { updateUserLocationData } from 'src/networkInfo/actions'
import { fetchUserLocationData } from 'src/networkInfo/saga'

describe(fetchUserLocationData, () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.resetMocks()
  })

  it('fetches location data then correctly dispatches the action', async () => {
    const MOCK_IP_LOCATION_DATA = {
      countryCodeAlpha2: 'US',
      region: 'CA',
      ipAddress: '172.1.1.0',
    }

    mockFetch.mockResponse(JSON.stringify(MOCK_IP_LOCATION_DATA))

    await expectSaga(fetchUserLocationData).put(updateUserLocationData(MOCK_IP_LOCATION_DATA)).run()
  })

  it('infers location from country code then correctly dispatches the action', async () => {
    const singaporeCallingCode = '+65'

    const MOCK_PHONE_LOCATION_DATA = {
      countryCodeAlpha2: 'SG',
      region: null,
      ipAddress: null,
    }

    mockFetch.mockReject(new Error('Location data service unavailable'))

    await expectSaga(fetchUserLocationData)
      .provide([[select(defaultCountryCodeSelector), singaporeCallingCode]])
      .put(updateUserLocationData(MOCK_PHONE_LOCATION_DATA))
      .run()
  })
})

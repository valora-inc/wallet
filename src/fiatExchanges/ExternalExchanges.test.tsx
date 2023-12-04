import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import ExternalExchanges from 'src/fiatExchanges/ExternalExchanges'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockCusdTokenId, mockExchanges } from 'test/values'

const mockStore = createMockStore({
  web3: {
    account: mockAccount,
  },
  networkInfo: {
    userLocationData: {
      countryCodeAlpha2: 'US',
      region: null,
      ipAddress: null,
    },
  },
})

describe('ExternalExchanges', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ExternalExchanges Screen will always have providers passed in via props
  it('shows list of available exchanges', async () => {
    const mockScreenProps = getMockStackScreenProps(Screens.ExternalExchanges, {
      tokenId: mockCusdTokenId,
      exchanges: mockExchanges,
    })

    const { getByTestId } = render(
      <Provider store={mockStore}>
        <ExternalExchanges {...mockScreenProps} />
      </Provider>
    )

    expect(getByTestId('provider-0')).toBeTruthy()
    expect(getByTestId('provider-1')).toBeTruthy()
    expect(getByTestId('provider-2')).toBeTruthy()
    await fireEvent.press(getByTestId('provider-1'))
    expect(navigateToURI).toBeCalledWith('https://coinlist.co/asset/celo')
  })
})

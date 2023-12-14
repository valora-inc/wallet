import { render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { fetchExchanges } from 'src/fiatExchanges/utils'
import QRNavigator, { QRCodePicker, QRCodeProps } from 'src/qrcode/QRNavigator'
import { CiCoCurrency } from 'src/utils/currencies'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockExchanges } from 'test/values'

jest.mock('react-native-permissions', () => jest.fn())

jest.mock('src/fiatExchanges/utils', () => ({
  ...(jest.requireActual('src/fiatExchanges/utils') as any),
  fetchExchanges: jest.fn(),
}))

jest.mock('src/qrcode/components/StyledQRGen', () => jest.fn().mockReturnValue(''))
jest.mock('src/qrcode/components/QRGen', () => jest.fn().mockReturnValue(''))

const mockStore = createMockStore({
  networkInfo: {
    userLocationData: {
      countryCodeAlpha2: 'US',
      region: null,
      ipAddress: '127.0.0.1',
    },
  },
  web3: {
    account: '0x0000',
  },
  account: {
    name: 'username',
  },
})

function getProps(): QRCodeProps {
  // getMockStackScreenProps won't work for the tab navigator
  return {
    route: {
      params: {},
    },
    qrSvgRef: jest.fn(),
  } as any
}

describe('QRNavigator', () => {
  describe('QRCodePicker', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('renders the new style', async () => {
      jest.mocked(fetchExchanges).mockResolvedValue(mockExchanges)

      const { queryByTestId } = render(
        <Provider store={mockStore}>
          <QRCodePicker {...getProps()} />
        </Provider>
      )
      await waitFor(() => expect(fetchExchanges).toHaveBeenCalledWith('US', CiCoCurrency.CELO))
      expect(queryByTestId('styledQRCode')).toBeTruthy()
    })
  })
  describe('QRNavigator component', () => {
    it('renders tabs for scan and my code', () => {
      const { queryByText, queryByTestId } = render(
        <Provider store={mockStore}>
          <MockedNavigator component={QRNavigator} />
        </Provider>
      )

      expect(queryByTestId('Times')).toBeTruthy()
      expect(queryByText('myCode')).toBeTruthy()
      expect(queryByText('scanCode')).toBeTruthy()
    })
  })
})

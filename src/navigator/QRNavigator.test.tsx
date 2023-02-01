import * as React from 'react'
import { QRCodePicker, QRCodeProps } from 'src/navigator/QRNavigator'
import { render, waitFor } from '@testing-library/react-native'
import { fetchExchanges } from 'src/fiatExchanges/utils'
import { Provider } from 'react-redux'
import { QRCodeDataType, QRCodeStyle } from 'src/statsig/types'
import { createMockStore } from 'test/utils'
import { mocked } from 'ts-jest/utils'
import { mockExchanges } from 'test/values'
import { CiCoCurrency } from 'src/utils/currencies'

jest.mock('react-native-permissions', () => jest.fn())

jest.mock('src/fiatExchanges/utils', () => ({
  ...(jest.requireActual('src/fiatExchanges/utils') as any),
  fetchExchanges: jest.fn(),
}))

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

function getProps(qrCodeStyle: QRCodeStyle): QRCodeProps {
  // getMockStackScreenProps won't work for the tab navigator
  return {
    route: {
      params: {
        qrCodeDataType: QRCodeDataType.Address,
        qrCodeStyle,
      },
    },
    qrSvgRef: jest.fn(),
  } as any
}

describe('QRNavigator', () => {
  describe('QRCodePicker', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('renders the new style when selected', async () => {
      mocked(fetchExchanges).mockResolvedValue(mockExchanges)

      const { queryByTestId } = render(
        <Provider store={mockStore}>
          <QRCodePicker {...getProps(QRCodeStyle.New)} />
        </Provider>
      )
      await waitFor(() => expect(fetchExchanges).toHaveBeenCalledWith('US', CiCoCurrency.CELO))
      expect(queryByTestId('styledQRCode')).toBeTruthy()
    })

    it('renders the legacy style when selected', async () => {
      const { queryByTestId } = render(
        <Provider store={mockStore}>
          <QRCodePicker {...getProps(QRCodeStyle.Legacy)} />
        </Provider>
      )
      await waitFor(() => expect(fetchExchanges).not.toHaveBeenCalled())
      expect(queryByTestId('QRCode')).toBeTruthy()
    })
  })
})

import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import QRNavigator, { QRCodePicker, QRCodeProps } from 'src/navigator/QRNavigator'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

jest.mock('src/qrcode/StyledQRGen', () => jest.fn().mockReturnValue(''))
jest.mock('src/qrcode/QRGen', () => jest.fn().mockReturnValue(''))

const mockStore = createMockStore({
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
      const { queryByTestId } = render(
        <Provider store={mockStore}>
          <QRCodePicker {...getProps()} />
        </Provider>
      )
      expect(queryByTestId('styledQRCode')).toBeTruthy()
      expect(queryByTestId('supportedNetworksNotification')).toBeTruthy()
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

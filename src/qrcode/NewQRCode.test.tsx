import * as React from 'react'
import { createMockStore } from 'test/utils'
import { fireEvent, render } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import { navigate } from 'src/navigator/NavigationService'
import Clipboard from '@react-native-clipboard/clipboard'
import { QRCodeDataType } from 'src/statsig/types'
import NewQRCode from 'src/qrcode/NewQRCode'
import { mockExchanges } from 'test/values'

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
}))

const mockStore = createMockStore({
  web3: {
    account: '0x0000',
  },
  account: {
    name: 'username',
  },
})

function getProps() {
  return {
    qrSvgRef: jest.fn() as any,
    exchanges: mockExchanges,
    dataType: QRCodeDataType.Address,
    onCloseBottomSheet: jest.fn(),
    onPressCopy: jest.fn(),
    onPressInfo: jest.fn(),
    onPressExchange: jest.fn(),
  }
}

describe('ExchangeQR', () => {
  beforeEach(() => {
    mockStore.dispatch = jest.fn()
    jest.clearAllMocks()
  })

  it('displays QR code, name, and address', () => {
    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <NewQRCode {...getProps()} />
      </Provider>
    )
    expect(queryByTestId('styledQRCode')).toBeTruthy()
    expect(queryByTestId('displayName')).toBeTruthy()
    expect(queryByTestId('address')).toBeTruthy()
  })

  it('does not display name when it has not been set', () => {
    const store = createMockStore({
      web3: {
        account: '0x000',
      },
      account: {
        name: undefined,
      },
    })
    store.dispatch = jest.fn()
    const { queryByTestId } = render(
      <Provider store={store}>
        <NewQRCode {...getProps()} />
      </Provider>
    )
    expect(queryByTestId('displayName')).toBeFalsy()
  })

  it('copies address when copy button pressed', async () => {
    const props = getProps()
    const { queryByTestId, getByTestId } = render(
      <Provider store={mockStore}>
        <NewQRCode {...props} />
      </Provider>
    )

    expect(queryByTestId('copyButton')).toBeTruthy()
    await fireEvent.press(getByTestId('copyButton'))
    expect(props.onPressCopy).toHaveBeenCalledTimes(1)
    expect(Clipboard.setString).toHaveBeenCalledWith('0x0000')
  })

  it('opens bottom sheet and can press link', async () => {
    const props = getProps()
    const { queryByTestId, getByTestId } = render(
      <Provider store={mockStore}>
        <NewQRCode {...props} />
      </Provider>
    )

    expect(queryByTestId('bottomSheetLink')).toBeTruthy()
    await fireEvent.press(getByTestId('bottomSheetLink'))
    expect(props.onPressInfo).toHaveBeenCalledTimes(1)

    expect(queryByTestId('BottomSheetContainer')).toBeTruthy()
    expect(queryByTestId('Bittrex-Touchable')).toBeTruthy()
    await fireEvent.press(getByTestId('Bittrex-Touchable'))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: 'https://bittrex.com/Market/Index?MarketName=USD-CELO',
    })
    expect(props.onPressExchange).toHaveBeenCalledTimes(1)
    expect(props.onPressExchange).toHaveBeenCalledWith(mockExchanges[0])
  })
})

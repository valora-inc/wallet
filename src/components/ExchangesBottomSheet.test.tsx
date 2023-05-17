import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import ExchangesBottomSheet from 'src/components/ExchangesBottomSheet'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import { getElementText } from 'test/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

jest.mock('src/components/useShowOrHideAnimation')

const exchanges: ExternalExchangeProvider[] = [
  {
    name: 'Coinbase Pro',
    link: 'https://example.com/0',
    currencies: [],
    supportedRegions: [],
  },
  {
    name: 'Bittrex',
    link: 'https://example.com/1',
    currencies: [],
    supportedRegions: [],
  },
  {
    name: 'KuCoin',
    link: 'https://example.com/2',
    currencies: [],
    supportedRegions: [],
  },
]

const onExchangeSelectedMock = jest.fn()
const onCloseMock = jest.fn()

describe('ExchangesBottomSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderExchangesBottomSheet(visible: boolean) {
    return render(
      <ExchangesBottomSheet
        isVisible={visible}
        onExchangeSelected={onExchangeSelectedMock}
        onClose={onCloseMock}
        exchanges={exchanges}
      />
    )
  }

  it('renders correctly', () => {
    const tree = renderExchangesBottomSheet(true)
    const { getByTestId } = tree

    expect(tree.getByTestId('BottomSheetContainer')).toBeTruthy()

    expect(getElementText(getByTestId('Coinbase Pro-Touchable'))).toBe('Coinbase Pro')
    expect(getElementText(getByTestId('Bittrex-Touchable'))).toBe('Bittrex')
    expect(getElementText(getByTestId('KuCoin-Touchable'))).toBe('KuCoin')
  })

  it('fires callback on exchange press and navigates', () => {
    const { getByTestId } = renderExchangesBottomSheet(true)

    fireEvent.press(getByTestId('Coinbase Pro-Touchable'))
    expect(onExchangeSelectedMock).toHaveBeenLastCalledWith(exchanges[0])
    expect(navigate).toHaveBeenLastCalledWith(Screens.WebViewScreen, {
      uri: exchanges[0].link,
    })

    fireEvent.press(getByTestId('Bittrex-Touchable'))
    expect(onExchangeSelectedMock).toHaveBeenLastCalledWith(exchanges[1])
    expect(navigate).toHaveBeenLastCalledWith(Screens.WebViewScreen, {
      uri: exchanges[1].link,
    })

    fireEvent.press(getByTestId('KuCoin-Touchable'))
    expect(onExchangeSelectedMock).toHaveBeenLastCalledWith(exchanges[2])
    expect(navigate).toHaveBeenLastCalledWith(Screens.WebViewScreen, {
      uri: exchanges[2].link,
    })
  })

  it('handles taps on the background correctly', () => {
    const { getByTestId } = renderExchangesBottomSheet(true)

    fireEvent.press(getByTestId('BackgroundTouchable'))
    expect(onCloseMock).toHaveBeenCalled()
  })

  it('renders nothing if not visible', () => {
    const { queryByTestId } = renderExchangesBottomSheet(false)
    expect(queryByTestId('BottomSheetContainer')).toBeFalsy()
  })
})

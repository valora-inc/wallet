import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import ExchangesBottomSheet from 'src/components/ExchangesBottomSheet'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
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

  it('renders correctly', () => {
    const { getByTestId } = render(
      <ExchangesBottomSheet
        onExchangeSelected={onExchangeSelectedMock}
        onClose={onCloseMock}
        exchanges={exchanges}
        forwardedRef={{ current: null }}
      />
    )

    expect(getByTestId('Coinbase Pro-Touchable')).toHaveTextContent('Coinbase Pro')
    expect(getByTestId('Bittrex-Touchable')).toHaveTextContent('Bittrex')
    expect(getByTestId('KuCoin-Touchable')).toHaveTextContent('KuCoin')
  })

  it('fires callback on exchange press and navigates', () => {
    const { getByTestId } = render(
      <ExchangesBottomSheet
        onExchangeSelected={onExchangeSelectedMock}
        onClose={onCloseMock}
        exchanges={exchanges}
        forwardedRef={{ current: null }}
      />
    )

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
})

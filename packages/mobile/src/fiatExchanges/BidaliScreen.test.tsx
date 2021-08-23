import * as React from 'react'
import { render } from 'react-native-testing-library'
import { WebView } from 'react-native-webview'
import { Provider } from 'react-redux'
import BidaliScreen from 'src/fiatExchanges/BidaliScreen'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = getMockStackScreenProps(Screens.BidaliScreen, {
  currency: Currency.Dollar,
})

declare global {
  interface Window {
    valora: any
  }
}

describe(BidaliScreen, () => {
  beforeEach(() => {
    // Reset injected JS effect
    window.valora = undefined
  })

  it('renders correctly when no phone number is provided', () => {
    const mockStore = createMockStore({
      account: { e164PhoneNumber: null },
      stableToken: { balances: { [Currency.Dollar]: '10', [Currency.Euro]: '5' } },
    })

    const { getByType } = render(
      <Provider store={mockStore}>
        <BidaliScreen {...mockScreenProps} />
      </Provider>
    )

    const webView = getByType(WebView)
    expect(webView).toBeDefined()
    // eslint-disable-next-line no-eval
    expect(eval(webView.props.injectedJavaScriptBeforeContentLoaded)).toBe(true)
    expect(window.valora).toMatchInlineSnapshot(`
      Object {
        "balances": Object {
          "CUSD": "10",
          "CEUR": "5"
        },
        "onPaymentRequest": [Function],
        "openUrl": [Function],
        "paymentCurrency": "CUSD",
        "phoneNumber": null,
      }
    `)
  })

  it('renders correctly when a phone number is provided', () => {
    const mockStore = createMockStore({
      account: { e164PhoneNumber: '+14155556666' },
      stableToken: { balances: { [Currency.Dollar]: '10', [Currency.Euro]: '5' } },
    })

    const { getByType } = render(
      <Provider store={mockStore}>
        <BidaliScreen {...mockScreenProps} />
      </Provider>
    )
    const webView = getByType(WebView)
    expect(webView).toBeDefined()
    // eslint-disable-next-line no-eval
    expect(eval(webView.props.injectedJavaScriptBeforeContentLoaded)).toBe(true)
    expect(window.valora).toMatchInlineSnapshot(`
      Object {
        "balances": Object {
          "CUSD": "10",
          "CEUR": "5"
        },
        "onPaymentRequest": [Function],
        "openUrl": [Function],
        "paymentCurrency": "CUSD",
        "phoneNumber": "+14155556666",
      }
    `)
  })
})

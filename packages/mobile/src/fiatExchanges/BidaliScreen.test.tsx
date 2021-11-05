import { render } from '@testing-library/react-native'
import * as React from 'react'
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
      stableToken: {
        balances: {
          [Currency.Dollar]: '10',
          [Currency.Euro]: '5',
          [Currency.Real]: '15',
        },
      },
    })

    const { UNSAFE_getByType } = render(
      <Provider store={mockStore}>
        <BidaliScreen {...mockScreenProps} />
      </Provider>
    )

    const webView = UNSAFE_getByType(WebView)
    expect(webView).toBeDefined()
    // eslint-disable-next-line no-eval
    expect(eval(webView.props.injectedJavaScriptBeforeContentLoaded)).toBe(true)
    expect(window.valora).toMatchInlineSnapshot(`
      Object {
        "balances": Object {
          "CEUR": "5",
          "CUSD": "10",
          "CBRL": "15"
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

    const { UNSAFE_getByType } = render(
      <Provider store={mockStore}>
        <BidaliScreen {...mockScreenProps} />
      </Provider>
    )
    const webView = UNSAFE_getByType(WebView)
    expect(webView).toBeDefined()
    // eslint-disable-next-line no-eval
    expect(eval(webView.props.injectedJavaScriptBeforeContentLoaded)).toBe(true)
    expect(window.valora).toMatchInlineSnapshot(`
      Object {
        "balances": Object {
          "CEUR": "5",
          "CUSD": "10",
          "CBRL": "3"
        },
        "onPaymentRequest": [Function],
        "openUrl": [Function],
        "paymentCurrency": "CUSD",
        "phoneNumber": "+14155556666",
      }
    `)
  })

  it('renders correctly when no currency is passed', () => {
    const mockStore = createMockStore({
      account: { e164PhoneNumber: '+14155556666' },
      stableToken: {
        balances: {
          [Currency.Dollar]: '10',
          [Currency.Euro]: '9',
          [Currency.Real]: '3',
        },
      },
    })

    const { UNSAFE_getByType } = render(
      <Provider store={mockStore}>
        <BidaliScreen
          {...getMockStackScreenProps(Screens.BidaliScreen, {
            currency: undefined,
          })}
        />
      </Provider>
    )
    const webView = UNSAFE_getByType(WebView)
    expect(webView).toBeDefined()
    // eslint-disable-next-line no-eval
    expect(eval(webView.props.injectedJavaScriptBeforeContentLoaded)).toBe(true)
    // `paymentCurrency` is CEUR here because it has the highest balance in the local currency
    expect(window.valora).toMatchInlineSnapshot(`
      Object {
        "balances": Object {
          "CEUR": "9",
          "CUSD": "10",
          "CBRL": "7"
        },
        "onPaymentRequest": [Function],
        "openUrl": [Function],
        "paymentCurrency": "CEUR",
        "phoneNumber": "+14155556666",
      }
    `)
  })
})

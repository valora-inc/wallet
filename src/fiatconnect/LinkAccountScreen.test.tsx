import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import FiatConnectLinkAccountScreen from 'src/fiatconnect/LinkAccountScreen'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockFiatConnectQuotes } from 'test/values'

describe('LinkAccountScreen', () => {
  const store = createMockStore()

  const normalizedQuote = new FiatConnectQuote({
    quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
    fiatAccountType: FiatAccountType.BankAccount,
    flow: CICOFlow.CashOut,
  })

  const props = getMockStackScreenProps(Screens.FiatConnectLinkAccount, {
    flow: CICOFlow.CashOut,
    quote: normalizedQuote,
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('shows description and continue button', () => {
    const { queryByTestId, queryByText } = render(
      <Provider store={store}>
        <FiatConnectLinkAccountScreen {...props} />
      </Provider>
    )

    expect(queryByText('fiatConnectLinkAccountScreen.bankAccount.bodyTitle')).toBeTruthy()
    expect(queryByTestId('descriptionText')).toBeTruthy()
    expect(queryByTestId('providerNameText')).toBeTruthy()
    expect(queryByTestId('continueButton')).toBeTruthy()
    expect(queryByTestId('termsAndConditionsText')).toBeTruthy()
    expect(queryByTestId('privacyPolicyText')).toBeTruthy()
  })

  it('navigates to provider site on clicking provider name', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <FiatConnectLinkAccountScreen {...props} />
      </Provider>
    )

    await fireEvent.press(getByTestId('providerNameText'))

    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: 'https://fakewebsite.valorapp.com',
    })
  })

  it('navigates to provider terms and conditions site on clicking terms and conditions', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <FiatConnectLinkAccountScreen {...props} />
      </Provider>
    )

    await fireEvent.press(getByTestId('termsAndConditionsText'))

    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: 'https://fakewebsite.valorapp.com/terms',
    })
  })

  it('navigates to provider privacy policy site on clicking privacy policy', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <FiatConnectLinkAccountScreen {...props} />
      </Provider>
    )

    await fireEvent.press(getByTestId('privacyPolicyText'))

    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: 'https://fakewebsite.valorapp.com/privacy',
    })
  })

  it('navigates to FiatDetails screen on clicking continue', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <FiatConnectLinkAccountScreen {...props} />
      </Provider>
    )

    await fireEvent.press(getByTestId('continueButton'))

    expect(navigate).toHaveBeenCalledWith(Screens.FiatDetailsScreen, {
      flow: CICOFlow.CashOut,
      quote: normalizedQuote,
    })
  })
})

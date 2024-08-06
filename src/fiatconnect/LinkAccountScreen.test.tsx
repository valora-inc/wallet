import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import _ from 'lodash'
import * as React from 'react'
import { Provider } from 'react-redux'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import FiatConnectLinkAccountScreen from 'src/fiatconnect/LinkAccountScreen'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockCusdTokenId, mockFiatConnectQuotes } from 'test/values'

describe('LinkAccountScreen', () => {
  const store = createMockStore()

  const normalizedQuote = new FiatConnectQuote({
    quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
    fiatAccountType: FiatAccountType.BankAccount,
    flow: CICOFlow.CashOut,
    tokenId: mockCusdTokenId,
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

  it.each`
    testId                      | uri
    ${'providerNameText'}       | ${'https://fakewebsite.example.com'}
    ${'termsAndConditionsText'} | ${'https://fakewebsite.example.com/terms'}
    ${'privacyPolicyText'}      | ${'https://fakewebsite.example.com/privacy'}
  `('Navigate to $uri when tapping text with testId $testId', async ({ testId, uri }) => {
    const { getByTestId } = render(
      <Provider store={store}>
        <FiatConnectLinkAccountScreen {...props} />
      </Provider>
    )

    await fireEvent.press(getByTestId(testId))

    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri,
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

  it.each`
    accountType                    | translationName
    ${FiatAccountType.BankAccount} | ${'bankAccount'}
    ${FiatAccountType.MobileMoney} | ${'mobileMoney'}
  `(
    'shows correct text for account type $accountType',
    async ({ accountType, translationName }) => {
      const accountTypeQuote = _.cloneDeep(normalizedQuote)
      accountTypeQuote.fiatAccountType = accountType

      const accountTypeProps = getMockStackScreenProps(Screens.FiatConnectLinkAccount, {
        flow: CICOFlow.CashOut,
        quote: accountTypeQuote,
      })

      const { queryByText } = render(
        <Provider store={store}>
          <FiatConnectLinkAccountScreen {...accountTypeProps} />
        </Provider>
      )

      expect(queryByText(`fiatConnectLinkAccountScreen.${translationName}.bodyTitle`)).toBeTruthy()
    }
  )
})

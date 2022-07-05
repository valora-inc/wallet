import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import _ from 'lodash'
import * as React from 'react'
import { Provider } from 'react-redux'
import { addNewFiatAccount, FiatConnectQuoteSuccess } from 'src/fiatconnect'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockFiatConnectQuotes } from 'test/values'
import FiatDetailsScreen from './FiatDetailsScreen'

jest.mock('src/fiatconnect', () => ({
  ...(jest.requireActual('src/fiatconnect') as any),
  addNewFiatAccount: jest.fn(() => Promise.resolve()),
}))

const store = createMockStore({})
const quote = new FiatConnectQuote({
  quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
  fiatAccountType: FiatAccountType.BankAccount,
  flow: CICOFlow.CashIn,
})
const mockScreenProps = getMockStackScreenProps(Screens.FiatDetailsScreen, {
  flow: CICOFlow.CashIn,
  quote,
})
describe('FiatDetailsScreen', () => {
  beforeEach(() => {
    store.dispatch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('can view a list of bank fields', () => {
    const { queryByText, queryByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    expect(queryByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    // checks presence of picker, testID is hardcoded and not customizable
    expect(queryByTestId('android_touchable_wrapper')).toBeTruthy()

    expect(queryByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(queryByTestId('input-accountNumber')).toBeTruthy()

    expect(queryByTestId('errorMessage')).toBeFalsy()

    expect(queryByTestId('selectedProviderButton')).toBeTruthy()
    expect(queryByTestId('nextButton')).toBeTruthy()
  })
  it('shows validation error if the input field does not fulfill the requirement', () => {
    const { queryByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    expect(queryByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    expect(queryByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(queryByTestId('errorMessage')).toBeFalsy()

    fireEvent.changeText(getByTestId('input-accountNumber'), '12dtfa')

    // Should see an error message saying the account number field is invalid
    expect(queryByTestId('errorMessage')).toBeTruthy()
    expect(queryByText('fiatAccountSchema.accountNumber.errorMessage')).toBeTruthy()
  })
  it('sends a request to add new fiat account after pressing the next button [Schema: AccountName]', async () => {
    // NOTE: Make a quote with no allowed values since setting a value on picker is hard
    const mockFcQuote = _.cloneDeep(mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess)
    mockFcQuote.fiatAccount.BankAccount = {
      ...mockFcQuote.fiatAccount.BankAccount,
      fiatAccountSchemas: [
        {
          fiatAccountSchema: FiatAccountSchema.AccountNumber,
          allowedValues: {},
        },
      ],
    }

    const quote = new FiatConnectQuote({
      quote: mockFcQuote,
      fiatAccountType: FiatAccountType.BankAccount,
      flow: CICOFlow.CashIn,
    })
    const mockScreenProps = getMockStackScreenProps(Screens.FiatDetailsScreen, {
      flow: CICOFlow.CashIn,
      quote,
    })

    const { getByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    const fakeInstitutionName = 'CapitalTwo Bank'
    const fakeAccountNumber = '1234567890'
    fireEvent.changeText(getByTestId('input-institutionName'), fakeInstitutionName)
    fireEvent.changeText(getByTestId('input-accountNumber'), fakeAccountNumber)

    const expectedBody = {
      accountName: 'n/a',
      institutionName: fakeInstitutionName,
      accountNumber: fakeAccountNumber,
      country: 'US',
      fiatAccountType: 'BankAccount',
    }
    await fireEvent.press(getByTestId('nextButton'))

    // TODO: should be called
    expect(addNewFiatAccount).not.toHaveBeenCalled()

    expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
      flow: CICOFlow.CashIn,
      normalizedQuote: quote,
      fiatAccount: expectedBody,
    })
  })
})

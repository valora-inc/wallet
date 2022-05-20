import { FiatAccountSchema } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { addNewFiatAccount } from 'src/fiatconnect'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import FiatDetailsScreen from './FiatDetailsScreen'

jest.mock('src/fiatconnect', () => ({
  ...(jest.requireActual('src/fiatconnect') as any),
  addNewFiatAccount: jest.fn(() => Promise.resolve()),
}))

const store = createMockStore({})
const providerURL = 'https://superLegitCICOProvider.valoraapp.com'
const mockScreenProps = getMockStackScreenProps(Screens.FiatDetailsScreen, {
  providerURL,
  fiatAccountSchema: FiatAccountSchema.AccountNumber,
  flow: CICOFlow.CashIn,
  provider: {
    name: 'Fake Provider',
    logo: 'https://fake.logo.url',
    logoWide: 'https://fake.logo.wide.url',
  },
})
describe('FiatDetailsScreen', () => {
  beforeEach(() => {
    store.dispatch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('can view a list of bank fields', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    expect(getByText('fiatAccountSchema.accountName.label')).toBeTruthy()
    expect(getByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    expect(getByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(queryByTestId('errorMessage')).toBeFalsy()

    expect(getByTestId('selectedProviderButton')).toBeTruthy()
    expect(getByTestId('nextButton')).toBeTruthy()
  })
  it('shows validation error if the input field does not fulfill the requirement', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    expect(getByText('fiatAccountSchema.accountName.label')).toBeTruthy()
    expect(getByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    expect(getByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(queryByTestId('errorMessage')).toBeFalsy()

    fireEvent.changeText(getByTestId('input-accountName'), 'test account')
    fireEvent.changeText(getByTestId('input-institutionName'), 'ma Chase Bank')
    fireEvent.changeText(getByTestId('input-accountNumber'), '12dtfa')

    // Should see an error message saying the account number field is invalid
    expect(getByTestId('errorMessage')).toBeTruthy()
    expect(getByText('fiatAccountSchema.accountNumber.errorMessage')).toBeTruthy()
  })
  it('sends a request to add new fiat account after pressing the next button [Schema: AccountName]', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    const fakeAccountName = 'ma loaded bank account'
    const fakeInstitutionName = 'CapitalTwo Bank'
    const fakeAccountNumber = '1234567890'
    fireEvent.changeText(getByTestId('input-accountName'), fakeAccountName)
    fireEvent.changeText(getByTestId('input-institutionName'), fakeInstitutionName)
    fireEvent.changeText(getByTestId('input-accountNumber'), fakeAccountNumber)

    const expectedBody = {
      accountName: fakeAccountName,
      institutionName: fakeInstitutionName,
      accountNumber: fakeAccountNumber,
      country: 'US',
      fiatAccountType: 'BankAccount',
    }
    await fireEvent.press(getByTestId('nextButton'))
    expect(addNewFiatAccount).toHaveBeenCalledWith(
      providerURL,
      FiatAccountSchema.AccountNumber,
      expectedBody
    )

    // TODO: should also expect to navigate to next screen
  })
})

import { Result } from '@badrap/result'
import { FiatAccountType, Network, FiatConnectError } from '@fiatconnect/fiatconnect-types'
import {
  FiatConnectApiClient,
  FiatConnectClient,
  ResponseError,
} from '@fiatconnect/fiatconnect-sdk'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockFiatConnectQuotes } from 'test/values'
import { TAG } from './FiatDetailsScreen'
import FiatDetailsScreen from './FiatDetailsScreen'
import Logger from 'src/utils/Logger'
import { showMessage, showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import i18n from 'src/i18n'

jest.mock('src/alert/actions')

jest.mock('src/utils/Logger', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

let mockResult = Result.ok(undefined)
jest.mock('@fiatconnect/fiatconnect-sdk', () => ({
  ...(jest.requireActual('@fiatconnect/fiatconnect-sdk') as any),
  FiatConnectClient: jest.fn(() => ({
    addFiatAccount: jest.fn(() => mockResult),
  })),
}))

const store = createMockStore({})
const quote = new FiatConnectQuote({
  quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
  fiatAccountType: FiatAccountType.BankAccount,
})
const mockScreenProps = getMockStackScreenProps(Screens.FiatDetailsScreen, {
  flow: CICOFlow.CashIn,
  quote,
})

describe('FiatDetailsScreen', () => {
  let fiatConnectClient: FiatConnectApiClient

  beforeEach(() => {
    mockResult = Result.ok(undefined)
    fiatConnectClient = new FiatConnectClient(
      {
        baseUrl: 'some-url',
        network: Network.Alfajores,
        accountAddress: 'some-address',
      },
      (msg: string) => Promise.resolve(msg)
    )
    store.dispatch = jest.fn()
    jest
      .spyOn(FiatConnectQuote.prototype, 'getFiatConnectClient')
      .mockImplementation(() => Promise.resolve(fiatConnectClient))
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

    expect(getByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    expect(getByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(queryByTestId('errorMessage')).toBeFalsy()

    fireEvent.changeText(getByTestId('input-institutionName'), 'ma Chase Bank')
    fireEvent.changeText(getByTestId('input-accountNumber'), '12dtfa')

    // Should see an error message saying the account number field is invalid
    expect(getByTestId('errorMessage')).toBeTruthy()
    expect(getByText('fiatAccountSchema.accountNumber.errorMessage')).toBeTruthy()
  })
  it('sends a successful request to add new fiat account after pressing the next button [Schema: AccountName]', async () => {
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

    expect(quote.getFiatConnectClient).toHaveBeenCalled()
    expect(fiatConnectClient.addFiatAccount).toHaveBeenCalledWith({
      fiatAccountSchema: 'AccountNumber',
      data: expectedBody,
    })
    expect(showMessage).toHaveBeenCalledWith(i18n.t('fiatDetailsScreen.addFiatAccountSuccess'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
      flow: CICOFlow.CashIn,
      normalizedQuote: quote,
      fiatAccount: expectedBody,
    })
  })
  it('does not navigate to next page when account already exists', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )
    mockResult = Result.err(
      new ResponseError('some message', { error: FiatConnectError.ResourceExists })
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

    expect(quote.getFiatConnectClient).toHaveBeenCalled()
    expect(fiatConnectClient.addFiatAccount).toHaveBeenCalledWith({
      fiatAccountSchema: 'AccountNumber',
      data: expectedBody,
    })

    expect(Logger.error).toHaveBeenCalledWith(
      TAG,
      `Error adding fiat account: ${FiatConnectError.ResourceExists}`
    )
    expect(showError).toHaveBeenCalledWith(ErrorMessages.ADD_FIAT_ACCOUNT_RESOURCE_EXIST)
    expect(navigate).not.toHaveBeenCalled()
  })
  it('does not navigate to next page when experiencing a general error', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )
    mockResult = Result.err(new ResponseError('some message'))
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

    expect(quote.getFiatConnectClient).toHaveBeenCalled()
    expect(fiatConnectClient.addFiatAccount).toHaveBeenCalledWith({
      fiatAccountSchema: 'AccountNumber',
      data: expectedBody,
    })

    expect(Logger.error).toHaveBeenCalledWith(TAG, `Error adding fiat account: some message`)
    expect(showError).toHaveBeenCalledWith(i18n.t('fiatDetailsScreen.addFiatAccountFailed'))
    expect(navigate).not.toHaveBeenCalled()
  })
})

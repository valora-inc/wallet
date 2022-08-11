import { Result } from '@badrap/result'
import {
  FiatConnectApiClient,
  FiatConnectClient,
  ResponseError,
} from '@fiatconnect/fiatconnect-sdk'
import {
  FiatAccountSchema,
  FiatAccountType,
  FiatConnectError,
  Network,
} from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import _ from 'lodash'
import * as React from 'react'
import { Provider } from 'react-redux'
import { showError, showMessage } from 'src/alert/actions'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { getFiatConnectClient } from 'src/fiatconnect/clients'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockFiatConnectProviderIcon, mockFiatConnectQuotes, mockNavigation } from 'test/values'
import { mocked } from 'ts-jest/utils'
import FiatDetailsScreen, { TAG } from './FiatDetailsScreen'

jest.mock('src/alert/actions')
jest.mock('src/analytics/ValoraAnalytics')

jest.mock('src/utils/Logger', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

const fakeInstitutionName = 'CapitalTwo Bank'
const fakeAccountNumber = '1234567890'
let mockResult = Result.ok({
  fiatAccountId: '1234',
  accountName: '7890',
  institutionName: fakeInstitutionName,
  fiatAccountType: 'BankAccount',
})
jest.mock('@fiatconnect/fiatconnect-sdk', () => ({
  ...(jest.requireActual('@fiatconnect/fiatconnect-sdk') as any),
  FiatConnectClient: jest.fn(() => ({
    addFiatAccount: jest.fn(() => mockResult),
  })),
}))
jest.mock('src/fiatconnect/clients')
jest.useFakeTimers()

const store = createMockStore({})
const quoteWithAllowedValues = new FiatConnectQuote({
  quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
  fiatAccountType: FiatAccountType.BankAccount,
  flow: CICOFlow.CashIn,
})
const mockScreenPropsWithAllowedValues = getMockStackScreenProps(Screens.FiatDetailsScreen, {
  flow: CICOFlow.CashIn,
  quote: quoteWithAllowedValues,
})

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

describe('FiatDetailsScreen', () => {
  let fiatConnectClient: FiatConnectApiClient

  beforeEach(() => {
    mockResult = Result.ok({
      fiatAccountId: '1234',
      accountName: '7890',
      institutionName: fakeInstitutionName,
      fiatAccountType: FiatAccountType.BankAccount,
    })
    fiatConnectClient = new FiatConnectClient(
      {
        baseUrl: 'some-url',
        network: Network.Alfajores,
        accountAddress: 'some-address',
      },
      (msg: string) => Promise.resolve(msg)
    )
    store.dispatch = jest.fn()
    mocked(getFiatConnectClient).mockResolvedValue(fiatConnectClient)
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('can view a list of bank fields', () => {
    const { queryByText, queryByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenPropsWithAllowedValues} />
      </Provider>
    )

    expect(queryByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    // checks presence of picker, testID is hardcoded and not customizable
    expect(queryByTestId('android_touchable_wrapper')).toBeTruthy()

    expect(queryByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(queryByTestId('input-accountNumber')).toBeTruthy()

    expect(queryByTestId(/errorMessage-.+/)).toBeFalsy()

    expect(queryByTestId('submitButton')).toBeTruthy()
    expect(queryByTestId('submitButton')).toBeDisabled()
    expect(queryByText('fiatDetailsScreen.submitAndContinue')).toBeTruthy()
  })
  it('renders header with provider image', () => {
    let headerTitle: React.ReactNode
    ;(mockNavigation.setOptions as jest.Mock).mockImplementation((options) => {
      headerTitle = options.headerTitle()
    })

    render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenPropsWithAllowedValues} />
      </Provider>
    )

    const { queryByTestId, getByTestId, queryByText } = render(
      <Provider store={store}>{headerTitle}</Provider>
    )

    expect(queryByText('fiatDetailsScreen.header')).toBeTruthy()
    expect(
      queryByText('fiatDetailsScreen.headerSubTitle, {"provider":"Provider Two"}')
    ).toBeTruthy()
    expect(queryByTestId('headerProviderIcon')).toBeTruthy()
    expect(getByTestId('headerProviderIcon').props.source.uri).toEqual(mockFiatConnectProviderIcon)
  })
  it('cancel button navigates to fiat exchange screen and fires analytics event', () => {
    let headerRight: React.ReactNode
    ;(mockNavigation.setOptions as jest.Mock).mockImplementation((options) => {
      headerRight = options.headerRight()
    })

    render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenPropsWithAllowedValues} />
      </Provider>
    )

    const { getByText, queryByText } = render(<Provider store={store}>{headerRight}</Provider>)

    expect(queryByText('cancel')).toBeTruthy()
    fireEvent.press(getByText('cancel'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchange)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      FiatExchangeEvents.cico_fiat_details_cancel,
      {
        flow: mockScreenPropsWithAllowedValues.route.params.flow,
        provider: quoteWithAllowedValues.getProviderId(),
        fiatAccountSchema: quoteWithAllowedValues.getFiatAccountSchema(),
      }
    )
  })
  it('back button navigates back and fires analytics event', () => {
    let headerLeft: React.ReactNode
    ;(mockNavigation.setOptions as jest.Mock).mockImplementation((options) => {
      headerLeft = options.headerLeft()
    })

    render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenPropsWithAllowedValues} />
      </Provider>
    )

    const { getByTestId, queryByTestId } = render(<Provider store={store}>{headerLeft}</Provider>)

    expect(queryByTestId('backButton')).toBeTruthy()
    fireEvent.press(getByTestId('backButton'))
    expect(navigateBack).toHaveBeenCalledWith()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(FiatExchangeEvents.cico_fiat_details_back, {
      flow: mockScreenPropsWithAllowedValues.route.params.flow,
      provider: quoteWithAllowedValues.getProviderId(),
      fiatAccountSchema: quoteWithAllowedValues.getFiatAccountSchema(),
    })
  })
  it('button remains disabled if required input field is empty', () => {
    const { queryByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenPropsWithAllowedValues} />
      </Provider>
    )

    expect(queryByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    expect(queryByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(queryByTestId(/errorMessage-.+/)).toBeFalsy()

    fireEvent.changeText(getByTestId('input-accountNumber'), fakeAccountNumber)

    expect(queryByTestId('submitButton')).toBeDisabled()
  })
  it('shows validation error if the input field does not fulfill the requirement after delay', () => {
    const { queryByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenPropsWithAllowedValues} />
      </Provider>
    )

    expect(queryByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    expect(queryByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(queryByTestId(/errorMessage-.+/)).toBeFalsy()

    fireEvent.changeText(getByTestId('input-accountNumber'), '12dtfa')

    // Should see an error message saying the account number field is invalid
    // after delay
    expect(queryByTestId(/errorMessage-.+/)).toBeFalsy()
    jest.advanceTimersByTime(1500)
    expect(queryByTestId('errorMessage-accountNumber')).toBeTruthy()
    expect(queryByText('fiatAccountSchema.accountNumber.errorMessage')).toBeTruthy()
    expect(queryByTestId('submitButton')).toBeDisabled()
  })
  it('shows validation error if the input field does not fulfill the requirement immediately on blur', () => {
    const { queryByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    expect(queryByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    expect(queryByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(queryByTestId(/errorMessage-.+/)).toBeFalsy()

    fireEvent.changeText(getByTestId('input-accountNumber'), '12dtfa')
    fireEvent(getByTestId('input-accountNumber'), 'blur')

    // Should see an error message saying the account number field is invalid
    // immediately since the field loses focus
    expect(queryByTestId('errorMessage-accountNumber')).toBeTruthy()
    expect(queryByText('fiatAccountSchema.accountNumber.errorMessage')).toBeTruthy()
    expect(queryByTestId('submitButton')).toBeDisabled()
  })
  it('sends a successful request to add new fiat account after pressing the next button [Schema: AccountName]', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('input-institutionName'), fakeInstitutionName)
    fireEvent.changeText(getByTestId('input-accountNumber'), fakeAccountNumber)

    const expectedBody = {
      accountName: 'CapitalTwo Bank (...7890)',
      institutionName: fakeInstitutionName,
      accountNumber: fakeAccountNumber,
      country: 'US',
      fiatAccountType: 'BankAccount',
    }
    await fireEvent.press(getByTestId('submitButton'))

    expect(getFiatConnectClient).toHaveBeenCalledWith(
      quote.getProviderId(),
      quote.getProviderBaseUrl()
    )
    expect(fiatConnectClient.addFiatAccount).toHaveBeenCalledWith({
      fiatAccountSchema: 'AccountNumber',
      data: expectedBody,
    })
    expect(showMessage).toHaveBeenCalledWith(i18n.t('fiatDetailsScreen.addFiatAccountSuccess'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
      flow: CICOFlow.CashIn,
      normalizedQuote: quote,
      fiatAccount: mockResult.isOk && mockResult.value,
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
      accountName: 'CapitalTwo Bank (...7890)',
      institutionName: fakeInstitutionName,
      accountNumber: fakeAccountNumber,
      country: 'US',
      fiatAccountType: 'BankAccount',
    }

    await fireEvent.press(getByTestId('submitButton'))

    expect(getFiatConnectClient).toHaveBeenCalledWith(
      quote.getProviderId(),
      quote.getProviderBaseUrl()
    )
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
      accountName: 'CapitalTwo Bank (...7890)',
      institutionName: fakeInstitutionName,
      accountNumber: fakeAccountNumber,
      country: 'US',
      fiatAccountType: 'BankAccount',
    }

    await fireEvent.press(getByTestId('submitButton'))

    expect(getFiatConnectClient).toHaveBeenCalledWith(
      quote.getProviderId(),
      quote.getProviderBaseUrl()
    )
    expect(fiatConnectClient.addFiatAccount).toHaveBeenCalledWith({
      fiatAccountSchema: 'AccountNumber',
      data: expectedBody,
    })

    expect(Logger.error).toHaveBeenCalledWith(TAG, `Error adding fiat account: some message`)
    expect(showError).toHaveBeenCalledWith(i18n.t('fiatDetailsScreen.addFiatAccountFailed'))
    expect(navigate).not.toHaveBeenCalled()
  })
})

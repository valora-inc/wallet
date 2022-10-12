import { Result } from '@badrap/result'
import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import _ from 'lodash'
import * as React from 'react'
import { Provider } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { SendingFiatAccountStatus, submitFiatAccount } from 'src/fiatconnect/slice'
import { FiatConnectSchemaCountryOverrides } from 'src/fiatconnect/types'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockFiatConnectProviderIcon, mockFiatConnectQuotes, mockNavigation } from 'test/values'
import FiatDetailsScreen from './FiatDetailsScreen'

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
const fakeAccountNumber = '1234567'
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

const accountNumberOverrides: FiatConnectSchemaCountryOverrides<FiatAccountSchema.AccountNumber> = {
  NG: {
    accountNumber: {
      regex: '^[0-9]{10}$',
      errorString: 'errorMessageDigitLength',
    },
  },
}
const store = createMockStore({
  fiatConnect: {
    schemaCountryOverrides: { [FiatAccountSchema.AccountNumber]: accountNumberOverrides },
  },
})
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
  beforeEach(() => {
    mockResult = Result.ok({
      fiatAccountId: '1234',
      accountName: '7890',
      institutionName: fakeInstitutionName,
      fiatAccountType: FiatAccountType.BankAccount,
    })
    store.dispatch = jest.fn()
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
    expect(queryByText('fiatAccountSchema.accountNumber.errorMessageDigit')).toBeTruthy()
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
    expect(queryByText('fiatAccountSchema.accountNumber.errorMessageDigit')).toBeTruthy()
    expect(queryByTestId('submitButton')).toBeDisabled()
  })
  it('shows country specific validation error using overrides', () => {
    const mockStore = createMockStore({
      fiatConnect: {
        schemaCountryOverrides: { [FiatAccountSchema.AccountNumber]: accountNumberOverrides },
      },
      networkInfo: { userLocationData: { countryCodeAlpha2: 'NG' } },
    })
    const { queryByText, getByTestId, queryByTestId } = render(
      <Provider store={mockStore}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    expect(queryByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    expect(queryByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(queryByTestId(/errorMessage-.+/)).toBeFalsy()

    fireEvent.changeText(getByTestId('input-accountNumber'), '123456')
    fireEvent(getByTestId('input-accountNumber'), 'blur')

    // Should see an error message saying the account number field is invalid
    // immediately since the field loses focus
    expect(queryByTestId('errorMessage-accountNumber')).toBeTruthy()
    expect(queryByText('fiatAccountSchema.accountNumber.errorMessageDigitLength')).toBeTruthy()
    expect(queryByTestId('submitButton')).toBeDisabled()
  })
  it('dispatches to saga when validation passes after pressing submit', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('input-institutionName'), fakeInstitutionName)
    fireEvent.changeText(getByTestId('input-accountNumber'), fakeAccountNumber)

    const mockFiatAccountData = {
      accountName: 'CapitalTwo Bank (...4567)',
      institutionName: fakeInstitutionName,
      accountNumber: fakeAccountNumber,
      country: 'US',
      fiatAccountType: 'BankAccount',
    }

    await fireEvent.press(getByTestId('submitButton'))

    expect(store.dispatch).toHaveBeenCalledWith(
      submitFiatAccount({
        flow: CICOFlow.CashIn,
        quote,
        fiatAccountData: mockFiatAccountData,
      })
    )
  })
  it('shows spinner while fiat account is sending', () => {
    const mockStore = createMockStore({
      fiatConnect: {
        sendingFiatAccountStatus: SendingFiatAccountStatus.Sending,
        schemaCountryOverrides: { [FiatAccountSchema.AccountNumber]: accountNumberOverrides },
      },
    })
    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )
    expect(queryByTestId('spinner')).toBeTruthy()
  })
  it('shows checkmark if fiat account and KYC have been approved', () => {
    const mockStore = createMockStore({
      fiatConnect: {
        sendingFiatAccountStatus: SendingFiatAccountStatus.KycApproved,
        schemaCountryOverrides: { [FiatAccountSchema.AccountNumber]: accountNumberOverrides },
      },
    })
    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )
    expect(queryByTestId('checkmark')).toBeTruthy()
  })
})

import { Result } from '@badrap/result'
import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import _ from 'lodash'
import * as React from 'react'
import { Provider } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { SendingFiatAccountStatus, submitFiatAccount } from 'src/fiatconnect/slice'
import { FiatAccountSchemaCountryOverrides } from 'src/fiatconnect/types'
import { navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  mockCusdTokenId,
  mockFiatConnectProviderIcon,
  mockFiatConnectQuotes,
  mockNavigation,
} from 'test/values'
import FiatDetailsScreen from './FiatDetailsScreen'

jest.mock('src/alert/actions')
jest.mock('src/analytics/AppAnalytics')

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

const schemaCountryOverrides: FiatAccountSchemaCountryOverrides = {
  NG: {
    [FiatAccountSchema.AccountNumber]: {
      accountNumber: {
        regex: '^[0-9]{10}$',
        errorString: 'errorMessageDigitLength',
      },
    },
  },
}
const store = createMockStore({ fiatConnect: { schemaCountryOverrides } })
const quoteWithAllowedValues = new FiatConnectQuote({
  quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
  fiatAccountType: FiatAccountType.BankAccount,
  flow: CICOFlow.CashIn,
  tokenId: mockCusdTokenId,
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
  tokenId: mockCusdTokenId,
})
const mockScreenProps = getMockStackScreenProps(Screens.FiatDetailsScreen, {
  flow: CICOFlow.CashIn,
  quote,
})

const mmQuote = new FiatConnectQuote({
  quote: _.cloneDeep(mockFiatConnectQuotes[4] as FiatConnectQuoteSuccess),
  fiatAccountType: FiatAccountType.MobileMoney,
  flow: CICOFlow.CashIn,
  tokenId: mockCusdTokenId,
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
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenPropsWithAllowedValues} />
      </Provider>
    )

    expect(getByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    expect(getByTestId('picker-institutionName')).toBeTruthy()

    expect(getByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(getByTestId('input-accountNumber')).toBeTruthy()

    expect(queryByTestId(/errorMessage-.+/)).toBeFalsy()

    expect(getByTestId('submitButton')).toBeTruthy()
    expect(getByTestId('submitButton')).toBeDisabled()
    expect(getByText('fiatDetailsScreen.submitAndContinue')).toBeTruthy()
  })

  it.each`
    accountType       | accountQuote | translationKey
    ${'Bank Account'} | ${quote}     | ${'fiatDetailsScreen.headerBankAccount'}
    ${'Mobile Money'} | ${mmQuote}   | ${'fiatDetailsScreen.headerMobileMoney'}
  `('renders $accountType header with provider image', ({ accountQuote, translationKey }) => {
    let headerTitle: React.ReactNode
    ;(mockNavigation.setOptions as jest.Mock).mockImplementation((options) => {
      headerTitle = options.headerTitle()
    })

    const mockScreenProps = getMockStackScreenProps(Screens.FiatDetailsScreen, {
      flow: CICOFlow.CashIn,
      quote: accountQuote,
    })

    render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )
    const { getByText, getByTestId } = render(<Provider store={store}>{headerTitle}</Provider>)
    expect(getByText(translationKey)).toBeTruthy()
    expect(
      getByText(
        `fiatDetailsScreen.headerSubTitle, {"provider":"${accountQuote.getProviderName()}"}`
      )
    ).toBeTruthy()
    expect(getByTestId('headerProviderIcon')).toBeTruthy()
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

    const { getByText } = render(<Provider store={store}>{headerRight}</Provider>)

    fireEvent.press(getByText('cancel'))
    expect(navigateHome).toHaveBeenCalled()
    expect(AppAnalytics.track).toHaveBeenCalledWith(FiatExchangeEvents.cico_fiat_details_cancel, {
      flow: mockScreenPropsWithAllowedValues.route.params.flow,
      provider: quoteWithAllowedValues.getProviderId(),
      fiatAccountSchema: quoteWithAllowedValues.getFiatAccountSchema(),
    })
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

    const { getByTestId } = render(<Provider store={store}>{headerLeft}</Provider>)

    expect(getByTestId('backButton')).toBeTruthy()
    fireEvent.press(getByTestId('backButton'))
    expect(navigateBack).toHaveBeenCalledWith()
    expect(AppAnalytics.track).toHaveBeenCalledWith(FiatExchangeEvents.cico_fiat_details_back, {
      flow: mockScreenPropsWithAllowedValues.route.params.flow,
      provider: quoteWithAllowedValues.getProviderId(),
      fiatAccountSchema: quoteWithAllowedValues.getFiatAccountSchema(),
    })
  })
  it('button remains disabled if required input field is empty', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenPropsWithAllowedValues} />
      </Provider>
    )

    expect(getByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    expect(getByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(queryByTestId(/errorMessage-.+/)).toBeFalsy()

    fireEvent.changeText(getByTestId('input-accountNumber'), fakeAccountNumber)

    expect(getByTestId('submitButton')).toBeDisabled()
  })
  it('shows validation error if the input field does not fulfill the requirement after delay', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenPropsWithAllowedValues} />
      </Provider>
    )

    expect(getByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    expect(getByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(queryByTestId(/errorMessage-.+/)).toBeFalsy()

    fireEvent.changeText(getByTestId('input-accountNumber'), '12dtfa')

    // Should see an error message saying the account number field is invalid
    // after delay
    expect(queryByTestId(/errorMessage-.+/)).toBeFalsy()
    jest.advanceTimersByTime(1500)
    expect(getByTestId('errorMessage-accountNumber')).toBeTruthy()
    expect(getByText('fiatAccountSchema.accountNumber.errorMessageDigit')).toBeTruthy()
    expect(getByTestId('submitButton')).toBeDisabled()
  })
  it('shows validation error if the input field does not fulfill the requirement immediately on blur', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    expect(getByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    expect(getByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(queryByTestId(/errorMessage-.+/)).toBeFalsy()

    fireEvent.changeText(getByTestId('input-accountNumber'), '12dtfa')
    fireEvent(getByTestId('input-accountNumber'), 'blur')

    // Should see an error message saying the account number field is invalid
    // immediately since the field loses focus
    expect(getByTestId('errorMessage-accountNumber')).toBeTruthy()
    expect(getByText('fiatAccountSchema.accountNumber.errorMessageDigit')).toBeTruthy()
    expect(getByTestId('submitButton')).toBeDisabled()
  })
  it('shows country specific validation error using overrides', () => {
    const mockStore = createMockStore({
      fiatConnect: { schemaCountryOverrides },
      networkInfo: { userLocationData: { countryCodeAlpha2: 'NG' } },
    })
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={mockStore}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    expect(getByText('fiatAccountSchema.institutionName.label')).toBeTruthy()
    expect(getByText('fiatAccountSchema.accountNumber.label')).toBeTruthy()
    expect(queryByTestId(/errorMessage-.+/)).toBeFalsy()

    fireEvent.changeText(getByTestId('input-accountNumber'), '123456')
    fireEvent(getByTestId('input-accountNumber'), 'blur')

    // Should see an error message saying the account number field is invalid
    // immediately since the field loses focus
    expect(getByTestId('errorMessage-accountNumber')).toBeTruthy()
    expect(getByText('fiatAccountSchema.accountNumber.errorMessageDigitLength')).toBeTruthy()
    expect(getByTestId('submitButton')).toBeDisabled()
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
        schemaCountryOverrides,
      },
    })
    const { getByTestId } = render(
      <Provider store={mockStore}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )
    expect(getByTestId('spinner')).toBeTruthy()
  })
  it('shows checkmark if fiat account and KYC have been approved', () => {
    const mockStore = createMockStore({
      fiatConnect: {
        sendingFiatAccountStatus: SendingFiatAccountStatus.KycApproved,
        schemaCountryOverrides,
      },
    })
    const { getByTestId } = render(
      <Provider store={mockStore}>
        <FiatDetailsScreen {...mockScreenProps} />
      </Provider>
    )
    expect(getByTestId('checkmark')).toBeTruthy()
  })
  it('displays info dialog for fields with infoDialog param set', () => {
    const mmScreenProps = getMockStackScreenProps(Screens.FiatDetailsScreen, {
      flow: CICOFlow.CashIn,
      quote: mmQuote,
    })

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <FiatDetailsScreen {...mmScreenProps} />
      </Provider>
    )

    expect(getByTestId('dialog-mobile')).not.toBeVisible()
    fireEvent.press(getByTestId('infoIcon-mobile'))
    expect(getByTestId('dialog-mobile')).toBeVisible()
    expect(getByText('fiatAccountSchema.mobileMoney.mobileDialog.title')).toBeTruthy()
    expect(getByText('fiatAccountSchema.mobileMoney.mobileDialog.dismiss')).toBeTruthy()
    expect(getByText('fiatAccountSchema.mobileMoney.mobileDialog.body')).toBeTruthy()
  })
})

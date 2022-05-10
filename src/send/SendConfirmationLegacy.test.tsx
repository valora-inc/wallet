import { StackScreenProps } from '@react-navigation/stack'
import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import { ErrorDisplayType } from 'src/alert/reducer'
import { SendOrigin } from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { FeeType } from 'src/fees/reducer'
import i18n from 'src/i18n'
import { AddressValidationType, E164NumberToAddressType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import { getSendFee } from 'src/send/saga'
import SendConfirmationLegacy from 'src/send/SendConfirmationLegacy'
import { Currency } from 'src/utils/currencies'
import {
  createMockStore,
  flushMicrotasksQueue,
  getElementText,
  getMockStackScreenProps,
  RecursivePartial,
} from 'test/utils'
import {
  mockAccount2Invite,
  mockAccountInvite,
  mockCusdAddress,
  mockE164NumberInvite,
  mockInviteTransactionData,
  mockTransactionDataLegacy,
} from 'test/values'

// A fee of 0.01 cUSD.
const TEST_FEE_INFO_CUSD = {
  fee: new BigNumber(10).pow(16),
  gas: new BigNumber(200000),
  gasPrice: new BigNumber(10).pow(10).times(5),
  feeCurrency: mockCusdAddress,
}

// A fee of 0.01 CELO.
const TEST_FEE_INFO_CELO = {
  fee: new BigNumber(10).pow(16),
  gas: new BigNumber(200000),
  gasPrice: new BigNumber(10).pow(10).times(5),
  feeCurrency: undefined,
}

jest.mock('src/components/useShowOrHideAnimation')
jest.mock('src/send/saga')

const mockedGetSendFee = getSendFee as jest.Mock

const mockScreenProps = getMockStackScreenProps(Screens.SendConfirmationLegacy, {
  transactionData: mockTransactionDataLegacy,
  origin: SendOrigin.AppSendFlow,
})

const mockInviteScreenProps = getMockStackScreenProps(Screens.SendConfirmationLegacy, {
  transactionData: mockInviteTransactionData,
  origin: SendOrigin.AppSendFlow,
})

type ScreenProps = StackScreenProps<
  StackParamList,
  Screens.SendConfirmationLegacy | Screens.SendConfirmationLegacyModal
>

describe('SendConfirmationLegacy', () => {
  beforeEach(() => {
    mockedGetSendFee.mockClear()
  })

  function renderScreen(
    storeOverrides: RecursivePartial<RootState> = {},
    screenProps?: ScreenProps
  ) {
    const store = createMockStore({
      stableToken: {
        balances: { [Currency.Dollar]: '200', [Currency.Euro]: '100' },
      },
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmationLegacy {...(screenProps ? screenProps : mockScreenProps)} />
      </Provider>
    )

    return {
      store,
      ...tree,
    }
  }

  it('renders correctly', async () => {
    const tree = renderScreen()
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for send payment confirmation with cUSD fees', async () => {
    mockedGetSendFee.mockImplementation(async () => TEST_FEE_INFO_CUSD)

    const { getByText, getByTestId } = renderScreen()

    fireEvent.press(getByText('feeEstimate'))

    jest.runAllTimers()
    await flushMicrotasksQueue()

    const feeComponent = getByTestId('feeDrawer/SendConfirmation/totalFee/value')
    expect(getElementText(feeComponent)).toEqual('₱0.0133')

    const totalComponent = getByTestId('TotalLineItem/Total/value')
    expect(getElementText(totalComponent)).toEqual('₱1.34')
  })

  it('renders correctly for send payment confirmation with CELO fees', async () => {
    mockedGetSendFee.mockImplementation(async () => TEST_FEE_INFO_CELO)

    const { getByText, getByTestId } = renderScreen()

    fireEvent.press(getByText('feeEstimate'))

    jest.runAllTimers()
    await flushMicrotasksQueue()

    const feeComponent = getByTestId('feeDrawer/SendConfirmation/totalFee/value')
    expect(getElementText(feeComponent)).toEqual('0.01')

    // NOTE: CELO fees are currently not combined into the total.
    // TODO: This should equal more than $1.33, depending on the CELO fee value.
    const totalComponent = getByTestId('TotalLineItem/Total/value')
    expect(getElementText(totalComponent)).toEqual('₱1.33')
  })

  it('shows a generic `calculateFeeFailed` error when fee estimate fails due to an unknown error', async () => {
    mockedGetSendFee.mockImplementation(async () => {
      throw new Error('Unknown error message')
    })

    const { store, getByText, queryByTestId } = renderScreen()

    store.clearActions()

    jest.runAllTimers()
    await flushMicrotasksQueue()

    const feeComponent = queryByTestId('feeDrawer/SendConfirmation/totalFee/value')
    expect(feeComponent).toBeFalsy()
    expect(getByText('---')).toBeTruthy()

    expect(store.getActions()).toEqual([
      {
        action: null,
        alertType: 'error',
        buttonMessage: null,
        dismissAfter: 5000,
        displayMethod: ErrorDisplayType.BANNER,
        message: i18n.t('calculateFeeFailed'),
        title: null,
        type: 'ALERT/SHOW',
        underlyingError: 'calculateFeeFailed',
      },
    ])
  })

  it('shows an `insufficientBalance` error when fee estimate fails due insufficient user balance', async () => {
    mockedGetSendFee.mockImplementation(async () => {
      throw new Error(ErrorMessages.INSUFFICIENT_BALANCE)
    })

    const { store, getByText, queryByTestId } = renderScreen()

    store.clearActions()

    jest.runAllTimers()
    await flushMicrotasksQueue()

    const feeComponent = queryByTestId('feeDrawer/SendConfirmation/totalFee/value')
    expect(feeComponent).toBeFalsy()
    expect(getByText('---')).toBeTruthy()

    expect(store.getActions()).toEqual([
      {
        action: null,
        alertType: 'error',
        buttonMessage: null,
        dismissAfter: 5000,
        displayMethod: ErrorDisplayType.BANNER,
        message: i18n.t('insufficientBalance'),
        title: null,
        type: 'ALERT/SHOW',
        underlyingError: 'insufficientBalance',
      },
    ])
  })

  it('renders correctly when there are multiple user addresses (should show edit button)', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164NumberInvite]: [mockAccountInvite, mockAccount2Invite],
    }

    const { getByTestId } = renderScreen({
      identity: {
        e164NumberToAddress: mockE164NumberToAddress,
        secureSendPhoneNumberMapping: {
          [mockE164NumberInvite]: {
            addressValidationType: AddressValidationType.FULL,
            address: mockAccount2Invite,
          },
        },
      },
    })

    expect(getByTestId('accountEditButton')).toBeTruthy()
  })

  it('updates the comment/reason', () => {
    const { getByTestId, queryAllByDisplayValue } = renderScreen({
      fees: {
        estimates: {
          [mockCusdAddress]: {
            [FeeType.SEND]: {
              usdFee: '1',
            },
          },
        },
      },
    })

    const input = getByTestId('commentInput/send')
    const comment = 'A comment!'
    fireEvent.changeText(input, comment)
    expect(queryAllByDisplayValue(comment)).toHaveLength(1)
  })

  it('navigates to ValidateRecipientIntro when "edit" button is pressed', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164NumberInvite]: [mockAccountInvite, mockAccount2Invite],
    }
    const mockAddressValidationType = AddressValidationType.PARTIAL

    const { getByTestId } = renderScreen({
      identity: {
        e164NumberToAddress: mockE164NumberToAddress,
        secureSendPhoneNumberMapping: {
          [mockE164NumberInvite]: {
            addressValidationType: mockAddressValidationType,
            address: mockAccount2Invite,
          },
        },
      },
    })

    fireEvent.press(getByTestId('accountEditButton'))
    expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientIntro, {
      origin: SendOrigin.AppSendFlow,
      transactionData: mockTransactionDataLegacy,
      addressValidationType: mockAddressValidationType,
    })
  })

  it('does nothing when trying to press "edit" when user has not gone through Secure Send', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164NumberInvite]: [mockAccount2Invite],
    }

    const { queryByTestId } = renderScreen({
      identity: {
        e164NumberToAddress: mockE164NumberToAddress,
        secureSendPhoneNumberMapping: {
          [mockE164NumberInvite]: {
            addressValidationType: AddressValidationType.NONE,
            address: undefined,
          },
        },
      },
    })

    expect(queryByTestId('accountEditButton')).toBeNull()
  })

  it('renders correct modal for invitations', () => {
    mockedGetSendFee.mockResolvedValue(TEST_FEE_INFO_CUSD)

    const { getByTestId, queryAllByTestId } = renderScreen({}, mockInviteScreenProps)

    expect(queryAllByTestId('InviteAndSendModal')[0].props.visible).toBe(false)
    fireEvent.press(getByTestId('ConfirmButton'))
    expect(queryAllByTestId('InviteAndSendModal')[0].props.visible).toBe(true)
  })
})

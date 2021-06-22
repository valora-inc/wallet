import BigNumber from 'bignumber.js'
import * as React from 'react'
import { fireEvent, flushMicrotasksQueue, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { ReactTestInstance } from 'react-test-renderer'
import { ErrorDisplayType } from 'src/alert/reducer'
import { SendOrigin } from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { AddressValidationType, E164NumberToAddressType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getSendFee } from 'src/send/saga'
import SendConfirmation from 'src/send/SendConfirmation'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  mockAccount2Invite,
  mockAccountInvite,
  mockE164NumberInvite,
  mockInviteTransactionData,
  mockTransactionData,
} from 'test/values'

// A fee of 0.01 cUSD.
const TEST_FEE_INFO_CUSD = {
  fee: new BigNumber(10).pow(16),
  gas: new BigNumber(200000),
  gasPrice: new BigNumber(10).pow(10).times(5),
  currency: Currency.Dollar,
}

// A fee of 0.01 CELO.
const TEST_FEE_INFO_CELO = {
  fee: new BigNumber(10).pow(16),
  gas: new BigNumber(200000),
  gasPrice: new BigNumber(10).pow(10).times(5),
  currency: Currency.Celo,
}

jest.mock('src/components/useShowOrHideAnimation')
jest.mock('src/send/saga')

const mockedGetSendFee = getSendFee as jest.Mock

const mockScreenProps = getMockStackScreenProps(Screens.SendConfirmation, {
  transactionData: mockTransactionData,
  origin: SendOrigin.AppSendFlow,
})

const mockInviteScreenProps = getMockStackScreenProps(Screens.SendConfirmation, {
  transactionData: mockInviteTransactionData,
  origin: SendOrigin.AppSendFlow,
})

describe('SendConfirmation', () => {
  beforeEach(() => {
    mockedGetSendFee.mockClear()
  })

  function renderScreen(storeOverrides: any = {}, screenProps?: any) {
    const store = createMockStore({
      stableToken: {
        balances: { [Currency.Dollar]: '200', [Currency.Euro]: '100' },
      },
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...(screenProps ? screenProps : mockScreenProps)} />
      </Provider>
    )

    return {
      store,
      ...tree,
    }
  }

  function amountFromComponent(component: ReactTestInstance) {
    return component.props.children.filter((child: any) => typeof child === 'string').join('')
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
    expect(amountFromComponent(feeComponent)).toEqual('$0.0133')

    const totalComponent = getByTestId('TotalLineItem/Total/value')
    expect(amountFromComponent(totalComponent)).toEqual('$1.34')
  })

  it('renders correctly for send payment confirmation with CELO fees', async () => {
    mockedGetSendFee.mockImplementation(async () => TEST_FEE_INFO_CELO)

    const { getByText, getByTestId } = renderScreen()

    fireEvent.press(getByText('feeEstimate'))

    jest.runAllTimers()
    await flushMicrotasksQueue()

    const feeComponent = getByTestId('feeDrawer/SendConfirmation/totalFee/value')
    expect(amountFromComponent(feeComponent)).toEqual('0.01')

    // NOTE: CELO fees are currently not combined into the total.
    // TODO: This should equal more than $1.33, depending on the CELO fee value.
    const totalComponent = getByTestId('TotalLineItem/Total/value')
    expect(amountFromComponent(totalComponent)).toEqual('$1.33')
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
        message: 'calculateFeeFailed',
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
        message: 'insufficientBalance',
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
          send: {
            feeInWei: '1',
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
      transactionData: mockTransactionData,
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

  it('renders correct modal for invitations', async () => {
    mockedGetSendFee.mockImplementation(async () => TEST_FEE_INFO_CUSD)

    const { queryByTestId, getByTestId } = renderScreen({}, mockInviteScreenProps)

    expect(queryByTestId('InviteAndSendModal')?.props.isVisible).toBe(false)
    fireEvent.press(getByTestId('ConfirmButton'))
    expect(queryByTestId('InviteAndSendModal')?.props.isVisible).toBe(true)
  })
})

import { StackScreenProps } from '@react-navigation/stack'
import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import { ErrorDisplayType } from 'src/alert/reducer'
import { SendOrigin } from 'src/analytics/types'
import i18n from 'src/i18n'
import { AddressValidationType, E164NumberToAddressType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import { sendPaymentOrInvite } from 'src/send/actions'
import SendConfirmation from 'src/send/SendConfirmation'
import { getGasPrice } from 'src/web3/gas'
import {
  createMockStore,
  flushMicrotasksQueue,
  getElementText,
  getMockStackScreenProps,
  RecursivePartial,
} from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockAccount2Invite,
  mockAccountInvite,
  mockCeurAddress,
  mockCusdAddress,
  mockE164Number,
  mockInvitableRecipient,
  mockTestTokenAddress,
  mockTokenInviteTransactionData,
  mockTokenTransactionData,
} from 'test/values'

const mockGasPrice = new BigNumber(50000000000)
const mockDekFeeGas = new BigNumber(100000)

jest.mock('src/web3/gas')
const mockGetGasPrice = getGasPrice as jest.Mock

jest.mock('src/web3/dataEncryptionKey', () => ({
  getRegisterDekTxGas: () => mockDekFeeGas,
}))

const mockScreenProps = getMockStackScreenProps(Screens.SendConfirmation, {
  transactionData: mockTokenTransactionData,
  origin: SendOrigin.AppSendFlow,
})

const mockInviteScreenProps = getMockStackScreenProps(Screens.SendConfirmation, {
  transactionData: mockTokenInviteTransactionData,
  origin: SendOrigin.AppSendFlow,
})

type ScreenProps = StackScreenProps<
  StackParamList,
  Screens.SendConfirmation | Screens.SendConfirmationModal
>

describe('SendConfirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetGasPrice.mockImplementation(() => mockGasPrice)
  })

  function renderScreen(
    storeOverrides: RecursivePartial<RootState> = {},
    screenProps?: ScreenProps
  ) {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCusdAddress]: {
            address: mockCusdAddress,
            symbol: 'cUSD',
            balance: '200',
            usdPrice: '1',
            isCoreToken: true,
          },
          [mockCeurAddress]: {
            address: mockCeurAddress,
            symbol: 'cEUR',
            balance: '100',
            usdPrice: '1.2',
            isCoreToken: true,
          },
          [mockTestTokenAddress]: {
            address: mockTestTokenAddress,
            symbol: 'TT',
            balance: '10',
            usdPrice: '0.1234',
          },
        },
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

  it('renders correctly', async () => {
    const tree = renderScreen()
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for send payment confirmation with CELO fees', async () => {
    const { getByText, getByTestId } = renderScreen()

    fireEvent.press(getByText('feeEstimate'))

    jest.runAllTimers()
    await flushMicrotasksQueue()

    const feeComponent = getByTestId('feeDrawer/SendConfirmation/totalFee/value')
    expect(getElementText(feeComponent)).toEqual('₱0.0466')

    // NOTE: CELO fees are currently not combined into the total.
    // TODO: This should equal more than $1.33, depending on the CELO fee value.
    const totalComponent = getByTestId('TotalLineItem/Total')
    expect(getElementText(totalComponent)).toEqual('₱1.33')
  })

  it('shows a generic `calculateFeeFailed` error when fee estimate fails due to an unknown error', async () => {
    mockGetGasPrice.mockImplementation(() => {
      throw new Error('Error while getting gas price')
    })

    const { store, queryByTestId, getByText } = renderScreen()

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

  it('renders correctly when there are multiple user addresses (should show edit button)', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164Number]: [mockAccountInvite, mockAccount2Invite],
    }

    const { getByTestId } = renderScreen(
      {
        identity: {
          e164NumberToAddress: mockE164NumberToAddress,
          secureSendPhoneNumberMapping: {
            [mockE164Number]: {
              addressValidationType: AddressValidationType.FULL,
              address: mockAccount2Invite,
            },
          },
        },
      },
      mockInviteScreenProps
    )

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

  it('doesnt show the comment for non core tokens', () => {
    const { queryByTestId } = renderScreen(
      {},
      getMockStackScreenProps(Screens.SendConfirmation, {
        transactionData: {
          ...mockTokenTransactionData,
          tokenAddress: mockTestTokenAddress,
        },
        origin: SendOrigin.AppSendFlow,
      })
    )

    expect(queryByTestId('commentInput/send')).toBeFalsy()
  })

  it('doesnt show the comment for invites', () => {
    const { queryByTestId } = renderScreen(
      {},
      getMockStackScreenProps(Screens.SendConfirmation, {
        transactionData: {
          ...mockTokenInviteTransactionData,
          recipient: {
            ...mockInvitableRecipient,
            e164PhoneNumber: '+14155550001',
          },
        },
        origin: SendOrigin.AppSendFlow,
      })
    )
    expect(queryByTestId('commentInput/send')).toBeFalsy()
  })

  it('navigates to ValidateRecipientIntro when "edit" button is pressed', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164Number]: [mockAccountInvite, mockAccount2Invite],
    }
    const mockAddressValidationType = AddressValidationType.PARTIAL

    const { getByTestId } = renderScreen(
      {
        identity: {
          e164NumberToAddress: mockE164NumberToAddress,
          secureSendPhoneNumberMapping: {
            [mockE164Number]: {
              addressValidationType: mockAddressValidationType,
              address: mockAccount2Invite,
            },
          },
        },
      },
      mockInviteScreenProps
    )

    fireEvent.press(getByTestId('accountEditButton'))
    expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientIntro, {
      origin: SendOrigin.AppSendFlow,
      transactionData: mockTokenInviteTransactionData,
      addressValidationType: mockAddressValidationType,
    })
  })

  it('does nothing when trying to press "edit" when user has not gone through Secure Send', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164Number]: [mockAccount2Invite],
    }

    const { queryByTestId } = renderScreen({
      identity: {
        e164NumberToAddress: mockE164NumberToAddress,
        secureSendPhoneNumberMapping: {
          [mockE164Number]: {
            addressValidationType: AddressValidationType.NONE,
            address: undefined,
          },
        },
      },
    })

    expect(queryByTestId('accountEditButton')).toBeNull()
  })

  it('renders correct modal for invitations', async () => {
    const { getByTestId, queryAllByTestId } = renderScreen(
      { identity: { e164NumberToAddress: {} } },
      mockInviteScreenProps
    )

    expect(queryAllByTestId('InviteAndSendModal')[0].props.visible).toBe(false)

    fireEvent.press(getByTestId('ConfirmButton'))

    expect(queryAllByTestId('InviteAndSendModal')[0].props.visible).toBe(true)
  })

  it('dispatches an action when the confirm button is pressed', async () => {
    const { store, getByTestId } = renderScreen({})

    expect(store.getActions().length).toEqual(0)

    fireEvent.press(getByTestId('ConfirmButton'))

    const { inputAmount, tokenAddress, recipient } = mockTokenTransactionData
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        sendPaymentOrInvite(
          inputAmount,
          tokenAddress,
          inputAmount.multipliedBy(1.33), // 1.33 is the default local currency exchange rate in tests
          inputAmount,
          '',
          recipient,
          undefined,
          false
        ),
      ])
    )
  })

  it('dispatches the send action with the right address when going through Secure Send', async () => {
    const { store, getByTestId } = renderScreen(
      {
        identity: {
          e164NumberToAddress: {
            [mockE164Number]: [mockAccount, mockAccount2],
          },
          secureSendPhoneNumberMapping: {
            [mockE164Number]: {
              address: mockAccount2,
              addressValidationType: AddressValidationType.FULL,
            },
          },
        },
      },
      getMockStackScreenProps(Screens.SendConfirmation, {
        transactionData: {
          ...mockTokenTransactionData,
          recipient: { e164PhoneNumber: mockE164Number },
        },
        origin: SendOrigin.AppSendFlow,
      })
    )

    expect(store.getActions().length).toEqual(0)

    fireEvent.press(getByTestId('ConfirmButton'))

    const { inputAmount, tokenAddress } = mockTokenTransactionData
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        sendPaymentOrInvite(
          inputAmount,
          tokenAddress,
          inputAmount.multipliedBy(1.33), // 1.33 is the default local currency exchange rate in tests
          inputAmount,
          '',
          { address: mockAccount2, e164PhoneNumber: mockE164Number },
          undefined,
          false
        ),
      ])
    )
  })
})

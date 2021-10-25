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
import SendConfirmation from 'src/send/SendConfirmation'
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
  mockCeurAddress,
  mockCusdAddress,
  mockE164Number,
  mockTokenInviteTransactionData,
  mockTokenTransactionData,
} from 'test/values'

const mockGasPrice = new BigNumber(50000000000)
const mockDekFeeGas = new BigNumber(100000)
jest.mock('src/web3/gas', () => ({
  getGasPrice: () => mockGasPrice,
}))
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
  })

  function renderScreen(
    storeOverrides: RecursivePartial<RootState> = {},
    screenProps?: ScreenProps
  ) {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCusdAddress]: {
            symbol: 'cUSD',
            balance: '200',
            usdPrice: '1',
          },
          [mockCeurAddress]: {
            symbol: 'cEUR',
            balance: '100',
            usdPrice: '1.2',
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

  it.only('renders correctly for send payment confirmation with CELO fees', async () => {
    const { getByText, getByTestId } = renderScreen()

    fireEvent.press(getByText('feeEstimate'))

    jest.runAllTimers()
    await flushMicrotasksQueue()

    const feeComponent = getByTestId('feeDrawer/SendConfirmation/totalFee/value')
    expect(getElementText(feeComponent)).toEqual('0.01')

    // NOTE: CELO fees are currently not combined into the total.
    // TODO: This should equal more than $1.33, depending on the CELO fee value.
    const totalComponent = getByTestId('TotalLineItem/Total')
    expect(getElementText(totalComponent)).toEqual('$1.33')
  })

  it('shows a generic `calculateFeeFailed` error when fee estimate fails due to an unknown error', async () => {
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
        message: i18n.t('calculateFeeFailed', { ns: 'global' }),
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
    const { getByTestId, queryAllByTestId } = renderScreen({}, mockInviteScreenProps)

    expect(queryAllByTestId('InviteAndSendModal')[0].props.visible).toBe(false)
    // Fire event press not working here so instead we call the onClick directly
    getByTestId('ConfirmButton').props.onClick()
    expect(queryAllByTestId('InviteAndSendModal')[0].props.visible).toBe(true)
  })
})

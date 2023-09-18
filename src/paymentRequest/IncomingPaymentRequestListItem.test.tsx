import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { showError } from 'src/alert/actions'
import { HomeEvents } from 'src/analytics/Events'
import { SendOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { NotificationBannerCTATypes, NotificationType } from 'src/home/types'
import { AddressValidationType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import IncomingPaymentRequestListItem from 'src/paymentRequest/IncomingPaymentRequestListItem'
import { TransactionDataInput } from 'src/send/SendAmount'
import { createMockStore, getElementText } from 'test/utils'
import {
  mockAccount3,
  mockCeurAddress,
  mockCusdAddress,
  mockE164Number,
  mockPaymentRequests,
  mockPhoneRecipient,
  mockRecipient,
  mockTokenBalances,
} from 'test/values'

const mockGetRecipientFromAddress = jest.fn((address: string) => {
  switch (address) {
    case mockAccount3:
      return mockPhoneRecipient
    default:
      return mockRecipient
  }
})
jest.mock('src/recipients/recipient', () => ({
  ...(jest.requireActual('src/recipients/recipient') as any),
  getRecipientFromAddress: (address: string) => mockGetRecipientFromAddress(address),
}))

jest.mock('src/analytics/ValoraAnalytics')

const mockPaymentRequest = mockPaymentRequests[1]

const balances = {
  tokenBalances: {
    ...mockTokenBalances,
    [mockCusdAddress]: {
      ...mockTokenBalances[mockCusdAddress],
      balance: '200',
    },
  },
}

const expectedTransactionData: TransactionDataInput = {
  comment: mockPaymentRequest.comment,
  recipient: mockRecipient,
  inputAmount: new BigNumber(mockPaymentRequest.amount),
  tokenAmount: new BigNumber(mockPaymentRequest.amount),
  amountIsInLocalCurrency: false,
  tokenAddress: mockCusdAddress,
  paymentRequestId: mockPaymentRequest.uid,
}

const identityLoading = {
  secureSendPhoneNumberMapping: {
    [mockE164Number]: {
      addressValidationType: AddressValidationType.NONE,
      isFetchingAddresses: true,
      lastFetchSuccessful: true,
    },
  },
}

const identityLoaded = {
  secureSendPhoneNumberMapping: {
    [mockE164Number]: {
      addressValidationType: AddressValidationType.NONE,
      isFetchingAddresses: false,
      lastFetchSuccessful: true,
    },
  },
}

const props = {
  paymentRequest: mockPaymentRequest,
  index: 4,
}

describe('IncomingPaymentRequestListItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const store = createMockStore()

    const tree = render(
      <Provider store={store}>
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })

  it('shows the phone number if there is no name associated with the address', () => {
    const store = createMockStore()
    const request = {
      ...mockPaymentRequest,
      requesterAddress: mockAccount3,
    }

    const { getByTestId } = render(
      <Provider store={store}>
        <IncomingPaymentRequestListItem paymentRequest={request} />
      </Provider>
    )

    expect(getElementText(getByTestId('IncomingPaymentRequestNotification/FAKE_ID_2/Title'))).toBe(
      'incomingPaymentRequestNotificationTitle, {"name":"+15551234567"}'
    )
  })

  it('displays the loading animation while fetching addresses', () => {
    const store = createMockStore()

    const tree = render(
      <Provider store={store}>
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )
    fireEvent.press(tree.getByText('send'))
    expect(tree.queryByTestId('loading/paymentRequest')).not.toBeNull()
  })

  it('navigates to send confirmation if there is no validation needed', () => {
    const store = createMockStore({
      identity: identityLoading,
      tokens: balances,
    })

    const tree = render(
      <Provider store={store}>
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    fireEvent.press(tree.getByText('send'))

    const updatedStore = createMockStore({
      identity: identityLoaded,
      tokens: balances,
    })

    tree.rerender(
      <Provider store={updatedStore}>
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
      origin: SendOrigin.AppRequestFlow,
      transactionData: expectedTransactionData,
      isFromScan: false,
    })
  })

  it('uses cEUR if the cUSD balance is too low', () => {
    const store = createMockStore({
      identity: identityLoading,
      tokens: {
        tokenBalances: {
          ...mockTokenBalances,
          [mockCeurAddress]: {
            ...mockTokenBalances[mockCeurAddress],
            balance: '200',
          },
        },
      },
    })

    const tree = render(
      <Provider store={store}>
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    fireEvent.press(tree.getByText('send'))

    const updatedStore = createMockStore({
      identity: identityLoaded,
      tokens: {
        tokenBalances: {
          ...mockTokenBalances,
          [mockCeurAddress]: {
            ...mockTokenBalances[mockCeurAddress],
            balance: '200',
          },
        },
      },
    })

    tree.rerender(
      <Provider store={updatedStore}>
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
      origin: SendOrigin.AppRequestFlow,
      transactionData: {
        ...expectedTransactionData,
        tokenAddress: mockCeurAddress,
        tokenAmount: new BigNumber('155.93965517241379310345'),
        inputAmount: new BigNumber('155.93965517241379310345'),
      },
      isFromScan: false,
    })
  })

  it('errors if cUSD and cEUR balance are too low', () => {
    const store = createMockStore({
      identity: identityLoading,
      tokens: {
        tokenBalances: mockTokenBalances,
      },
    })

    const tree = render(
      <Provider store={store}>
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    fireEvent.press(tree.getByText('send'))

    const updatedStore = createMockStore({
      identity: identityLoaded,
      tokens: {
        tokenBalances: mockTokenBalances,
      },
    })
    updatedStore.dispatch = jest.fn()

    tree.rerender(
      <Provider store={updatedStore}>
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    expect(navigate).not.toHaveBeenCalled()
    expect(updatedStore.dispatch).toHaveBeenCalledWith(
      showError(ErrorMessages.INSUFFICIENT_BALANCE_STABLE)
    )
  })

  it('navigates to secure send if there is validation needed', () => {
    const store = createMockStore({
      identity: identityLoading,
      tokens: balances,
    })

    const tree = render(
      <Provider store={store}>
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    fireEvent.press(tree.getByText('send'))

    const updatedStore = createMockStore({
      identity: {
        secureSendPhoneNumberMapping: {
          [mockE164Number]: {
            addressValidationType: AddressValidationType.PARTIAL,
            isFetchingAddresses: false,
            lastFetchSuccessful: true,
          },
        },
      },
      tokens: balances,
    })

    tree.rerender(
      <Provider store={updatedStore}>
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientIntro, {
      origin: SendOrigin.AppRequestFlow,
      transactionData: expectedTransactionData,
      addressValidationType: AddressValidationType.PARTIAL,
      requesterAddress: mockRecipient.address,
    })
  })

  it('does not navigate when address fetch is unsuccessful', () => {
    const store = createMockStore({
      identity: identityLoading,
      tokens: balances,
    })

    const tree = render(
      <Provider store={store}>
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    fireEvent.press(tree.getByText('send'))

    const updatedStore = createMockStore({
      identity: {
        secureSendPhoneNumberMapping: {
          [mockE164Number]: {
            addressValidationType: AddressValidationType.PARTIAL,
            isFetchingAddresses: false,
            lastFetchSuccessful: false,
          },
        },
      },
      tokens: balances,
    })

    tree.rerender(
      <Provider store={updatedStore}>
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    expect(navigate).toBeCalledTimes(0)
  })

  it('emits correct analytics event when CTA button is pressed', () => {
    const store = createMockStore({
      identity: identityLoading,
      tokens: balances,
    })

    const { getByText } = render(
      <Provider store={store}>
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    fireEvent.press(getByText('send'))

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(HomeEvents.notification_select, {
      notificationType: NotificationType.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.pay,
      notificationPositionInList: 4,
    })
  })

  it('emits correct analytics event when notification is dismissed', () => {
    const store = createMockStore({
      identity: identityLoading,
      tokens: balances,
    })

    const { getByText } = render(
      <Provider store={store}>
        <IncomingPaymentRequestListItem {...props} />
      </Provider>
    )

    fireEvent.press(getByText('decline'))

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(HomeEvents.notification_select, {
      notificationType: NotificationType.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.decline,
      notificationPositionInList: 4,
    })
  })
})

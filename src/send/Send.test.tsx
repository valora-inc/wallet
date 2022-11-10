import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { SendOrigin } from 'src/analytics/types'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Send from 'src/send/Send'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  mockE164Number,
  mockE164NumberInvite,
  mockRecipient,
  mockRecipient2,
  mockRecipient4,
} from 'test/values'

const mockScreenProps = getMockStackScreenProps(Screens.Send)

const defaultStore = {
  send: {
    inviteRewardsEnabled: false,
    recentRecipients: [mockRecipient],
    showSendToAddressWarning: true,
  },
  app: {
    numberVerified: true,
  },
  recipients: {
    phoneRecipientCache: {
      [mockE164Number]: mockRecipient2,
      [mockE164NumberInvite]: mockRecipient4,
    },
  },
}

describe('Send', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with invite rewards disabled', async () => {
    const store = createMockStore(defaultStore)

    const tree = render(
      <Provider store={store}>
        <Send {...mockScreenProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    expect(tree.queryByTestId('InviteRewardsBanner')).toBeFalsy()
  })

  it('renders correctly with invite rewards enabled', async () => {
    const store = createMockStore({
      ...defaultStore,
      send: {
        ...defaultStore.send,
        inviteRewardsEnabled: true,
        inviteRewardCusd: 1,
      },
    })

    const tree = render(
      <Provider store={store}>
        <Send {...mockScreenProps} />
      </Provider>
    )

    expect(tree.queryByTestId('InviteRewardsBanner')).toBeTruthy()
  })

  it('looks up a contact and navigates to the send amount screen', async () => {
    const store = createMockStore(defaultStore)

    const { getAllByTestId } = render(
      <Provider store={store}>
        <Send {...mockScreenProps} />
      </Provider>
    )

    fireEvent.press(getAllByTestId('RecipientItem')[0])

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      recipient: expect.objectContaining(mockRecipient),
      isOutgoingPaymentRequest: false,
      origin: SendOrigin.AppSendFlow,
      forceTokenAddress: undefined,
    })
  })

  it('looks up a contact and displays the invite modal', async () => {
    const store = createMockStore({
      ...defaultStore,
      app: {
        ...defaultStore.app,
        centralPhoneVerificationEnabled: true,
      },
      identity: {
        e164NumberToAddress: { [mockRecipient4.e164PhoneNumber]: null },
      },
    })
    store.dispatch = jest.fn()

    const { getAllByTestId, getByText } = render(
      <Provider store={store}>
        <Send {...mockScreenProps} />
      </Provider>
    )

    fireEvent.press(getAllByTestId('RecipientItem')[2])

    expect(store.dispatch).toHaveBeenCalledWith(
      fetchAddressesAndValidate(mockRecipient4.e164PhoneNumber)
    )

    await waitFor(() => expect(getByText('inviteModal.sendInviteButtonLabel')).toBeTruthy())
    expect(navigate).not.toHaveBeenCalled()
  })
})

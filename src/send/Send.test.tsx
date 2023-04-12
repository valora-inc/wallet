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
  mockCeloAddress,
  mockCusdAddress,
  mockE164Number,
  mockE164NumberInvite,
  mockRecipient,
  mockRecipient2,
  mockRecipient4,
  mockTokenBalances,
} from 'test/values'

const mockScreenProps = (params: {
  isOutgoingPaymentRequest?: boolean
  skipContactsImport?: boolean
  forceTokenAddress?: boolean
  defaultTokenOverride?: string
  showBackButton?: boolean
}) => getMockStackScreenProps(Screens.Send, params)

const defaultStore = {
  send: {
    inviteRewardsVersion: 'disabled',
    recentRecipients: [mockRecipient],
    showSendToAddressWarning: true,
  },
  app: {
    numberVerified: true,
    phoneNumberVerified: true,
  },
  recipients: {
    phoneRecipientCache: {
      [mockE164Number]: mockRecipient2,
      [mockE164NumberInvite]: mockRecipient4,
    },
  },
  tokens: {
    tokenBalances: {
      [mockCeloAddress]: {
        ...mockTokenBalances[mockCeloAddress],
        balance: '20.0',
      },
      [mockCusdAddress]: {
        ...mockTokenBalances[mockCusdAddress],
        balance: '10.0',
      },
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
        <Send {...mockScreenProps({})} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    expect(tree.queryByTestId('InviteRewardsBanner')).toBeFalsy()
  })

  it('renders correctly with NFT invite rewards enabled', async () => {
    const store = createMockStore({
      ...defaultStore,
      send: {
        ...defaultStore.send,
        inviteRewardsVersion: 'v4',
        inviteRewardCusd: 1,
      },
    })

    const tree = render(
      <Provider store={store}>
        <Send {...mockScreenProps({})} />
      </Provider>
    )

    expect(tree.getByText('inviteRewardsBanner.title')).toBeTruthy()
    expect(tree.getByTestId('InviteRewardsBanner')).toHaveTextContent('inviteRewardsBanner.body')
  })

  it('renders correctly with cUSD invite rewards enabled', async () => {
    const store = createMockStore({
      ...defaultStore,
      send: {
        ...defaultStore.send,
        inviteRewardsVersion: 'v5',
        inviteRewardCusd: 1,
      },
    })

    const tree = render(
      <Provider store={store}>
        <Send {...mockScreenProps({})} />
      </Provider>
    )

    expect(tree.getByText('inviteRewardsBannerCUSD.title')).toBeTruthy()
    expect(tree.getByTestId('InviteRewardsBanner')).toHaveTextContent(
      'inviteRewardsBannerCUSD.body'
    )
  })

  it('looks up a contact, prompts token entry, navigates to the send amount screen', async () => {
    const store = createMockStore(defaultStore)

    const { getAllByTestId, findByTestId } = render(
      <Provider store={store}>
        <Send {...mockScreenProps({})} />
      </Provider>
    )

    fireEvent.press(getAllByTestId('RecipientItem')[0])

    const tokenOption = await findByTestId('cUSDBalance')
    fireEvent.press(tokenOption)

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      recipient: expect.objectContaining(mockRecipient),
      isOutgoingPaymentRequest: false,
      origin: SendOrigin.AppSendFlow,
      defaultTokenOverride: mockCusdAddress,
    })
  })

  it('looks up a contact, navigates to the send amount screen', async () => {
    const store = createMockStore(defaultStore)

    const { getAllByTestId } = render(
      <Provider store={store}>
        <Send
          {...mockScreenProps({
            isOutgoingPaymentRequest: true,
            defaultTokenOverride: mockCeloAddress,
            forceTokenAddress: true,
          })}
        />
      </Provider>
    )

    fireEvent.press(getAllByTestId('RecipientItem')[0])

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      recipient: expect.objectContaining(mockRecipient),
      isOutgoingPaymentRequest: true,
      origin: SendOrigin.AppRequestFlow,
      defaultTokenOverride: mockCeloAddress,
      forceTokenAddress: true,
    })
  })

  it('looks up a contact and displays the invite modal', async () => {
    const store = createMockStore({
      ...defaultStore,
      app: {
        ...defaultStore.app,
      },
      identity: {
        e164NumberToAddress: { [mockRecipient4.e164PhoneNumber]: null },
      },
    })
    store.dispatch = jest.fn()

    const { getAllByTestId, getByText } = render(
      <Provider store={store}>
        <Send {...mockScreenProps({})} />
      </Provider>
    )

    fireEvent.press(getAllByTestId('RecipientItem')[2])

    expect(store.dispatch).toHaveBeenCalledWith(
      fetchAddressesAndValidate(mockRecipient4.e164PhoneNumber)
    )

    await waitFor(() => expect(getByText('inviteModal.sendInviteButtonLabel')).toBeTruthy())
    expect(navigate).not.toHaveBeenCalled()
  })

  it('shows back button when parameter is set', () => {
    const { queryByTestId } = render(
      <Provider store={createMockStore(defaultStore)}>
        <Send {...mockScreenProps({ showBackButton: true })} />
      </Provider>
    )

    expect(queryByTestId('BackChevron')).toBeTruthy()
  })
})

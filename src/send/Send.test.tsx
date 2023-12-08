import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { SendOrigin } from 'src/analytics/types'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Send from 'src/send/Send'
import { getFeatureGate } from 'src/statsig'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockCeloTokenId,
  mockCusdTokenId,
  mockE164Number,
  mockE164NumberInvite,
  mockRecipient,
  mockRecipient2,
  mockRecipient4,
  mockTokenBalances,
} from 'test/values'

const mockScreenProps = (params: {
  skipContactsImport?: boolean
  forceTokenId?: boolean
  defaultTokenIdOverride?: string
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
      [mockCeloTokenId]: {
        ...mockTokenBalances[mockCeloTokenId],
        balance: '20.0',
      },
      [mockCusdTokenId]: {
        ...mockTokenBalances[mockCusdTokenId],
        balance: '10.0',
      },
    },
  },
  identity: {
    addressToVerificationStatus: {
      [mockRecipient.address]: true,
    },
  },
}

jest.mock('src/statsig', () => {
  return {
    getFeatureGate: jest.fn(),
    getDynamicConfigParams: jest.fn(() => ({
      showSend: ['celo-alfajores'],
    })),
  }
})

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
      origin: SendOrigin.AppSendFlow,
      defaultTokenIdOverride: mockCusdTokenId,
      isFromScan: false,
    })
  })

  it('looks up a contact, navigates to the send amount screen', async () => {
    const store = createMockStore(defaultStore)

    const { getAllByTestId } = render(
      <Provider store={store}>
        <Send
          {...mockScreenProps({
            defaultTokenIdOverride: mockCeloTokenId,
            forceTokenId: true,
          })}
        />
      </Provider>
    )

    fireEvent.press(getAllByTestId('RecipientItem')[0])

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      recipient: expect.objectContaining(mockRecipient),
      origin: SendOrigin.AppSendFlow,
      defaultTokenIdOverride: mockCeloTokenId,
      forceTokenId: true,
      isFromScan: false,
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

  it('looks up a new phone number and navigates to send amount if it has two addresses', async () => {
    const store = createMockStore({
      ...defaultStore,
      identity: {
        e164NumberToAddress: { [mockRecipient4.e164PhoneNumber]: [mockAccount, mockAccount2] },
      },
    })
    const { getAllByTestId } = render(
      <Provider store={store}>
        <Send
          {...mockScreenProps({
            defaultTokenIdOverride: mockCeloTokenId,
          })}
        />
      </Provider>
    )
    fireEvent.press(getAllByTestId('RecipientItem')[2])

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
    expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
      recipient: expect.objectContaining(mockRecipient4),
      origin: SendOrigin.AppSendFlow,
      defaultTokenIdOverride: mockCeloTokenId,
      isFromScan: false,
    })
  })

  it('uses old send flow by default', () => {
    const store = createMockStore(defaultStore)

    const { getAllByTestId, getByTestId } = render(
      <Provider store={store}>
        <Send {...mockScreenProps({})} />
      </Provider>
    )

    fireEvent.press(getAllByTestId('RecipientItem')[0])
    expect(getByTestId('TokenBottomSheet')).toBeTruthy()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('uses new send flow when enabled', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const store = createMockStore(defaultStore)

    const { getAllByTestId } = render(
      <Provider store={store}>
        <Send {...mockScreenProps({})} />
      </Provider>
    )

    fireEvent.press(getAllByTestId('RecipientItem')[0])
    expect(navigate).toHaveBeenCalledWith(Screens.SendEnterAmount, {
      isFromScan: false,
      origin: SendOrigin.AppSendFlow,
      recipient: expect.objectContaining(mockRecipient),
    })
  })
})

import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
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
  beforeAll(() => {
    jest.useRealTimers()
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
})

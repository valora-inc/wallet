import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import InviteOptionsModal from 'src/components/InviteOptionsModal'
import { Recipient, RecipientType } from 'src/recipients/recipient'
import { createMockStore } from 'test/utils'

it('renders correctly with invite rewards disabled', () => {
  const recipient: Recipient = {
    name: 'John Doe',
    address: '0x123000',
    recipientType: RecipientType.Address,
  }

  const tree = render(
    <Provider
      store={createMockStore({
        web3: {
          account: '0xabc123',
        },
        send: {
          inviteRewardsVersion: 'none',
        },
        app: {
          phoneNumberVerified: false,
        },
      })}
    >
      <InviteOptionsModal
        recipient={recipient}
        onClose={() => {
          return null
        }}
      />
    </Provider>
  )

  expect(tree.getByTestId('InviteModalStyledDescription')).toHaveTextContent('inviteModal.body')
})

it('renders correctly with invite rewards NFTs', () => {
  const recipient: Recipient = {
    name: 'John Doe',
    address: '0x123000',
    recipientType: RecipientType.Address,
  }

  const tree = render(
    <Provider
      store={createMockStore({
        web3: {
          account: '0xabc123',
        },
        send: {
          inviteRewardsVersion: 'v4',
        },
        app: {
          phoneNumberVerified: true,
        },
      })}
    >
      <InviteOptionsModal
        recipient={recipient}
        onClose={() => {
          return null
        }}
      />
    </Provider>
  )
  expect(tree.getByTestId('InviteModalStyledDescription')).toHaveTextContent(
    'inviteModal.rewardsActive.body, {"contactName":"John Doe"}'
  )
})

it('renders correctly with invite rewards cUSD', () => {
  const recipient: Recipient = {
    name: 'John Doe',
    address: '0x123000',
    recipientType: RecipientType.Address,
  }

  const tree = render(
    <Provider
      store={createMockStore({
        web3: {
          account: '0xabc123',
        },
        send: {
          inviteRewardsVersion: 'v5',
        },
        app: {
          phoneNumberVerified: true,
        },
      })}
    >
      <InviteOptionsModal
        recipient={recipient}
        onClose={() => {
          return null
        }}
      />
    </Provider>
  )
  expect(tree.getByTestId('InviteModalStyledDescription')).toHaveTextContent(
    'inviteModal.rewardsActiveCUSD.body, {"contactName":"John Doe"}'
  )
})

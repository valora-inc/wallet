import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import InviteOptionsModal from 'src/components/InviteOptionsModal'
import { Recipient } from 'src/recipients/recipient'
import { createMockStore } from 'test/utils'

it('renders correctly', () => {
  const recipient: Recipient = { name: 'John Doe', address: '0x123000' }

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
      <InviteOptionsModal recipient={recipient} onClose={() => {}} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

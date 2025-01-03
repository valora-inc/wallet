import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import Avatar from 'src/components/Avatar'
import { RecipientType } from 'src/recipients/recipient'
import { createMockStore } from 'test/utils'

const mockName = 'mockName'
const mockNumber = '+14155556666'
const mockAccount = '0x0000000000000000000000000000000000007E57'

const store = createMockStore({
  account: {
    defaultCountryCode: '+1',
  },
})

describe('Avatar', () => {
  it('renders correctly with number and name', () => {
    const tree = render(
      <Provider store={store}>
        <Avatar
          recipient={{
            name: mockName,
            e164PhoneNumber: mockNumber,
            recipientType: RecipientType.PhoneNumber,
          }}
          iconSize={40}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly with just number', () => {
    const tree = render(
      <Provider store={store}>
        <Avatar
          recipient={{ e164PhoneNumber: mockNumber, recipientType: RecipientType.PhoneNumber }}
          iconSize={40}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly with address and name but no number', () => {
    const tree = render(
      <Provider store={store}>
        <Avatar
          recipient={{ name: mockName, address: mockAccount, recipientType: RecipientType.Address }}
          iconSize={40}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly with address but no name nor number', () => {
    const tree = render(
      <Provider store={store}>
        <Avatar
          recipient={{ address: mockAccount, recipientType: RecipientType.Address }}
          iconSize={40}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})

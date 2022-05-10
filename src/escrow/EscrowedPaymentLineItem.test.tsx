import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import EscrowedPaymentLineItem from 'src/escrow/EscrowedPaymentLineItem'
import { escrowPaymentDouble } from 'src/escrow/testValues'
import { createMockStore } from 'test/utils'
import { mockE164Number, mockE164NumberHashWithPepper, mockE164NumberPepper } from 'test/values'

const mockName = 'Hello World'

describe(EscrowedPaymentLineItem, () => {
  it('renders correctly', () => {
    const store = createMockStore({})
    const tree = render(
      <Provider store={store}>
        <EscrowedPaymentLineItem payment={escrowPaymentDouble({})} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })

  it('fetches the correct phone number from the identifier mapping', () => {
    const store = createMockStore({
      identity: {
        e164NumberToSalt: {
          [mockE164Number]: mockE164NumberPepper,
        },
      },
      recipients: {
        phoneRecipientCache: {},
      },
    })
    const tree = render(
      <Provider store={store}>
        <EscrowedPaymentLineItem
          payment={escrowPaymentDouble({
            recipientIdentifier: mockE164NumberHashWithPepper,
          })}
        />
      </Provider>
    )

    expect(tree.toJSON()).toEqual(mockE164Number)
  })

  it('fetches the correct name from the recipient cache', () => {
    const store = createMockStore({
      identity: {
        e164NumberToSalt: {
          [mockE164Number]: mockE164NumberPepper,
        },
      },
      recipients: {
        phoneRecipientCache: {
          [mockE164Number]: {
            name: mockName,
            contactId: '123',
          },
        },
      },
    })
    const tree = render(
      <Provider store={store}>
        <EscrowedPaymentLineItem
          payment={escrowPaymentDouble({
            recipientIdentifier: mockE164NumberHashWithPepper,
          })}
        />
      </Provider>
    )

    expect(tree.toJSON()).toEqual(mockName)
  })
})

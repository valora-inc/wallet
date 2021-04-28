import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import EscrowedPaymentLineItem from 'src/escrow/EscrowedPaymentLineItem'
import { escrowPaymentDouble } from 'src/escrow/__mocks__'
import { RecipientKind } from 'src/recipients/recipient'
import { createMockStore } from 'test/utils'
import { mockE164Number, mockE164NumberHash } from 'test/values'

const mockName = 'Hello World'

describe(EscrowedPaymentLineItem, () => {
  it('renders correctly', () => {
    const store = createMockStore({})
    const tree = renderer.create(
      <Provider store={store}>
        <EscrowedPaymentLineItem payment={escrowPaymentDouble({})} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })

  it('fetches the correct phone number from the identifier mapping', () => {
    const store = createMockStore({
      identity: {
        identifierToE164Number: {
          [mockE164NumberHash]: mockE164Number,
        },
      },
    })
    const tree = renderer.create(
      <Provider store={store}>
        <EscrowedPaymentLineItem
          payment={escrowPaymentDouble({
            recipientIdentifier: mockE164NumberHash,
          })}
        />
      </Provider>
    )

    expect(tree.toJSON()).toEqual(mockE164Number)
  })

  it('fetches the correct name from the recipient cache', () => {
    const store = createMockStore({
      identity: {
        identifierToE164Number: {
          [mockE164NumberHash]: mockE164Number,
        },
      },
      recipients: {
        recipientCache: {
          [mockE164Number]: {
            kind: RecipientKind.Contact,
            displayName: mockName,
            contactId: '123',
          },
        },
      },
    })
    const tree = renderer.create(
      <Provider store={store}>
        <EscrowedPaymentLineItem
          payment={escrowPaymentDouble({
            recipientIdentifier: mockE164NumberHash,
          })}
        />
      </Provider>
    )

    expect(tree.toJSON()).toEqual(mockName)
  })
})

import { render } from '@testing-library/react-native'
import { noop } from 'lodash'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { cancelPaymentRequest, updatePaymentRequestNotified } from 'src/paymentRequest/actions'
import OutgoingPaymentRequestListItem from 'src/paymentRequest/OutgoingPaymentRequestListItem'
import { createMockStore } from 'test/utils'
const store = createMockStore()

const commonProps = {
  id: '1',
  amount: '24',
  comment: 'Hey thanks for the loan, Ill pay you back ASAP. LOVE YOU',
  requestee: {
    e164PhoneNumber: '5126608970',
    displayId: '5126608970',
    address: '0x91623f625e23ac1400',
    name: '5126608970',
    contact: undefined,
  },
  cancelPaymentRequest: noop as typeof cancelPaymentRequest,
  updatePaymentRequestNotified: noop as typeof updatePaymentRequestNotified,
}

describe('OutgoingPaymentRequestListItem', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <OutgoingPaymentRequestListItem {...commonProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })
})

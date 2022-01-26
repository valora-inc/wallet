import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import ReclaimPaymentConfirmationCard from 'src/escrow/ReclaimPaymentConfirmationCard'
import {} from 'src/home/NotificationBox'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'
import { mockCusdAddress, mockE164Number, mockRecipient } from 'test/values'

const store = createMockStore()

const TEST_FEE_INFO = {
  fee: new BigNumber(10).pow(16),
  gas: new BigNumber(200000),
  gasPrice: new BigNumber(10).pow(10).times(5),
  feeCurrency: mockCusdAddress,
}

describe('ReclaimPaymentConfirmationCard', () => {
  it('renders correctly for send payment confirmation', () => {
    const tree = render(
      <Provider store={store}>
        <ReclaimPaymentConfirmationCard
          recipientPhone={mockE164Number}
          recipientContact={mockRecipient}
          amount={new BigNumber(10)}
          currency={Currency.Dollar}
          feeInfo={TEST_FEE_INFO}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})

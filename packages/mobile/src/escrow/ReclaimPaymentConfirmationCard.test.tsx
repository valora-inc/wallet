import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import ReclaimPaymentConfirmationCard from 'src/escrow/ReclaimPaymentConfirmationCard'
import { FeeType } from 'src/fees/reducer'
import { WEI_PER_TOKEN } from 'src/geth/consts'
import {} from 'src/home/NotificationBox'
import { createMockStore } from 'test/utils'
import { mockCusdAddress, mockE164Number, mockRecipient } from 'test/values'

const TEST_FEE_INFO = {
  fee: new BigNumber(10).pow(16),
  gas: new BigNumber(200000),
  gasPrice: new BigNumber(10).pow(10).times(5),
  feeCurrency: mockCusdAddress,
}

const mockFeeEstimates = {
  [FeeType.SEND]: undefined,
  [FeeType.INVITE]: undefined,
  [FeeType.EXCHANGE]: undefined,
  [FeeType.RECLAIM_ESCROW]: {
    usdFee: '0.01',
    lastUpdated: 500,
    loading: false,
    error: false,
    feeInfo: TEST_FEE_INFO,
  },
  [FeeType.REGISTER_DEK]: undefined,
}

const store = createMockStore({
  fees: {
    estimates: {
      [mockCusdAddress]: mockFeeEstimates,
    },
  },
})

describe('ReclaimPaymentConfirmationCard', () => {
  it('renders correctly for send payment confirmation', () => {
    const tree = render(
      <Provider store={store}>
        <ReclaimPaymentConfirmationCard
          recipientPhone={mockE164Number}
          recipientContact={mockRecipient}
          amount={new BigNumber(10).times(WEI_PER_TOKEN)}
          tokenAddress={mockCusdAddress}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})

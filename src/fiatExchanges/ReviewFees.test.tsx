import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import ReviewFees from 'src/fiatExchanges/ReviewFees'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { createMockStore } from 'test/utils'
import { mockCeloTokenId } from 'test/values'

const mockStore = createMockStore()

const fiatSubTotal = 25.09
const fiatTotal = 31
const cusdAmount = 25

const mockScreenProps = (feeWaived: boolean) => ({
  provider: 'Simplex',
  tokenIdToBuy: mockCeloTokenId,
  localCurrency: LocalCurrencyCode.USD,
  crypto: {
    amount: cusdAmount,
  },
  fiat: {
    subTotal: fiatSubTotal,
    total: fiatTotal,
  },
  feeWaived,
  feeUrl: 'google.com',
})

describe('ReviewFees', () => {
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('renders correctly', async () => {
    const tree = render(
      <Provider store={mockStore}>
        <ReviewFees {...mockScreenProps(false)} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()

    tree.rerender(
      <Provider store={mockStore}>
        <ReviewFees {...mockScreenProps(true)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('shows the fee discount when enabled', async () => {
    const tree = render(
      <Provider store={mockStore}>
        <ReviewFees {...mockScreenProps(true)} />
      </Provider>
    )

    const elements = tree.queryAllByText('feeDiscount')
    expect(elements).toHaveLength(1)
  })

  it('does not show the fee discount when disabled', async () => {
    const tree = render(
      <Provider store={mockStore}>
        <ReviewFees {...mockScreenProps(false)} />
      </Provider>
    )

    const elements = tree.queryAllByText('feeDiscount')
    expect(elements).toHaveLength(0)
  })
})

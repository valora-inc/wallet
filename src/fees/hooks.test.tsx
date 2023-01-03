import { render } from '@testing-library/react-native'
import React from 'react'
import { Text, View } from 'react-native'
import { Provider } from 'react-redux'
import { useMaxSendAmount } from 'src/fees/hooks'
import { estimateFee, FeeType } from 'src/fees/reducer'
import { RootState } from 'src/redux/reducers'
import { ONE_HOUR_IN_MILLIS } from 'src/utils/time'
import { createMockStore, getElementText, RecursivePartial } from 'test/utils'
import {
  emptyFees,
  mockCeloAddress,
  mockCeurAddress,
  mockCusdAddress,
  mockFeeInfo,
} from 'test/values'

interface ComponentProps {
  feeType: FeeType.SEND
  tokenAddress: string
  shouldRefresh: boolean
}
function TestComponent({ feeType, tokenAddress, shouldRefresh }: ComponentProps) {
  const max = useMaxSendAmount(tokenAddress, feeType, shouldRefresh)
  return (
    <View>
      <Text testID="maxSendAmount">{max.toString()}</Text>
    </View>
  )
}

const mockFeeEstimates = (error: boolean = false, lastUpdated: number = Date.now()) => ({
  ...emptyFees,
  [FeeType.SEND]: {
    usdFee: '0.02',
    lastUpdated,
    loading: false,
    error,
    feeInfo: mockFeeInfo,
  },
})

describe('useMaxSendAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderComponent(
    storeOverrides: RecursivePartial<RootState> = {},
    props: ComponentProps
  ) {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCusdAddress]: {
            address: mockCusdAddress,
            symbol: 'cUSD',
            balance: '200',
            usdPrice: '1',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
          [mockCeurAddress]: {
            address: mockCeurAddress,
            symbol: 'cEUR',
            balance: '100',
            usdPrice: '1.2',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
          [mockCeloAddress]: {
            address: mockCeloAddress,
            symbol: 'CELO',
            balance: '200',
            usdPrice: '5',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
        },
      },
      fees: {
        estimates: {
          [mockCusdAddress]: mockFeeEstimates(),
          [mockCeurAddress]: mockFeeEstimates(),
          [mockCeloAddress]: mockFeeEstimates(),
        },
      },
      ...storeOverrides,
    })
    store.dispatch = jest.fn()
    const tree = render(
      <Provider store={store}>
        <TestComponent {...props} />
      </Provider>
    )

    return {
      store,
      ...tree,
    }
  }

  it('returns balance when feeCurrency is not the specified token', () => {
    const { getByTestId } = renderComponent(
      {},
      { feeType: FeeType.SEND, tokenAddress: mockCusdAddress, shouldRefresh: true }
    )
    expect(getElementText(getByTestId('maxSendAmount'))).toBe('200')
  })
  it('returns a balance minus fee estimate when the feeCurrency matches the specified token', () => {
    const { getByTestId } = renderComponent(
      {},
      { feeType: FeeType.SEND, tokenAddress: mockCeloAddress, shouldRefresh: true }
    )
    expect(getElementText(getByTestId('maxSendAmount'))).toBe('199.996')
  })
  it('calls dispatch(estimateFee) when there is a feeEstimate error for the token', () => {
    const { getByTestId, store } = renderComponent(
      {
        fees: {
          estimates: {
            [mockCusdAddress]: mockFeeEstimates(true),
            [mockCeurAddress]: mockFeeEstimates(true),
            [mockCeloAddress]: mockFeeEstimates(true),
          },
        },
      },
      { feeType: FeeType.SEND, tokenAddress: mockCusdAddress, shouldRefresh: true }
    )
    expect(store.dispatch).toHaveBeenCalledWith(
      estimateFee({ feeType: FeeType.SEND, tokenAddress: mockCusdAddress })
    )
    expect(getElementText(getByTestId('maxSendAmount'))).toBe('200')
  })
  it('calls dispatch(estimateFee) when the feeEstimate is more than an hour old', () => {
    const twoHoursAgo = Date.now() - ONE_HOUR_IN_MILLIS * 2
    const { getByTestId, store } = renderComponent(
      {
        fees: {
          estimates: {
            [mockCusdAddress]: mockFeeEstimates(false, twoHoursAgo),
            [mockCeurAddress]: mockFeeEstimates(false, twoHoursAgo),
            [mockCeloAddress]: mockFeeEstimates(false, twoHoursAgo),
          },
        },
      },
      { feeType: FeeType.SEND, tokenAddress: mockCusdAddress, shouldRefresh: true }
    )
    expect(store.dispatch).toHaveBeenCalledWith(
      estimateFee({ feeType: FeeType.SEND, tokenAddress: mockCusdAddress })
    )
    expect(getElementText(getByTestId('maxSendAmount'))).toBe('200')
  })
  it('does not call dispatch(estimateFee) when the feeEstimate is less than an hour old', () => {
    const halfHourAgo = Date.now() - ONE_HOUR_IN_MILLIS / 2
    const { getByTestId, store } = renderComponent(
      {
        fees: {
          estimates: {
            [mockCusdAddress]: mockFeeEstimates(false, halfHourAgo),
            [mockCeurAddress]: mockFeeEstimates(false, halfHourAgo),
            [mockCeloAddress]: mockFeeEstimates(false, halfHourAgo),
          },
        },
      },
      { feeType: FeeType.SEND, tokenAddress: mockCeloAddress, shouldRefresh: true }
    )
    expect(store.dispatch).not.toHaveBeenCalled()
    expect(getElementText(getByTestId('maxSendAmount'))).toBe('199.996')
  })
  it('does not call dispatch(estimateFee) when the shouldRefresh is false', () => {
    const twoHoursAgo = Date.now() - ONE_HOUR_IN_MILLIS * 2
    const { getByTestId, store } = renderComponent(
      {
        fees: {
          estimates: {
            [mockCusdAddress]: mockFeeEstimates(false, twoHoursAgo),
            [mockCeurAddress]: mockFeeEstimates(false, twoHoursAgo),
            [mockCeloAddress]: mockFeeEstimates(false, twoHoursAgo),
          },
        },
      },
      { feeType: FeeType.SEND, tokenAddress: mockCeloAddress, shouldRefresh: false }
    )
    expect(store.dispatch).not.toHaveBeenCalled()
    expect(getElementText(getByTestId('maxSendAmount'))).toBe('199.996')
  })
})

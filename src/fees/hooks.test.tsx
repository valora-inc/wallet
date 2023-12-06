import { render } from '@testing-library/react-native'
import React from 'react'
import { Text, View } from 'react-native'
import { Provider } from 'react-redux'
import { useMaxSendAmountByAddress } from 'src/fees/hooks'
import { FeeType, estimateFee } from 'src/fees/reducer'
import { RootState } from 'src/redux/reducers'
import { NetworkId } from 'src/transactions/types'
import { ONE_HOUR_IN_MILLIS } from 'src/utils/time'
import { RecursivePartial, createMockStore, getElementText } from 'test/utils'
import {
  emptyFees,
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockFeeInfo,
} from 'test/values'

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

interface ComponentProps {
  feeType: FeeType.SEND
  tokenAddress?: string
  shouldRefresh: boolean
}
function TestComponent({ feeType, tokenAddress, shouldRefresh }: ComponentProps) {
  const max = useMaxSendAmountByAddress(tokenAddress, feeType, shouldRefresh)
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

describe('useMaxSendAmountByAddress', () => {
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
          [mockCusdTokenId]: {
            address: mockCusdAddress,
            tokenId: mockCusdTokenId,
            networkId: NetworkId['celo-alfajores'],
            symbol: 'cUSD',
            balance: '200',
            priceUsd: '1',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
          [mockCeurTokenId]: {
            address: mockCeurAddress,
            tokenId: mockCeurTokenId,
            networkId: NetworkId['celo-alfajores'],
            symbol: 'cEUR',
            balance: '100',
            priceUsd: '1.2',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
          [mockCeloTokenId]: {
            address: mockCeloAddress,
            tokenId: mockCeloTokenId,
            networkId: NetworkId['celo-alfajores'],
            symbol: 'CELO',
            balance: '200',
            priceUsd: '5',
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
  it('returns zero when tokenAddress is undefined', () => {
    const { getByTestId } = renderComponent({}, { feeType: FeeType.SEND, shouldRefresh: true })
    expect(getElementText(getByTestId('maxSendAmount'))).toBe('0')
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

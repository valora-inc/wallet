import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import SwapTransactionDetails from 'src/swap/SwapTransactionDetails'
import { createMockStore } from 'test/utils'
import {
  mockCeloTokenBalance,
  mockCeloTokenId,
  mockCusdTokenId,
  mockTokenBalances,
} from 'test/values'

describe('SwapTransactionDetails', () => {
  it('should render the correct exchange rate and estimated value', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          networkFee={new BigNumber(0.0001)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          slippageInfoBottomSheetRef={{ current: null }}
          feeTokenId={'someId'}
          slippagePercentage={'0.5'}
          fetchingSwapQuote={false}
          fromToken={{
            ...mockTokenBalances[mockCusdTokenId],
            lastKnownPriceUsd: null,
            balance: BigNumber('10'),
            priceUsd: BigNumber('1'),
          }}
          toToken={mockCeloTokenBalance}
          exchangeRatePrice="0.5837"
          swapAmount={BigNumber('1')}
        />
      </Provider>
    )

    expect(getByText('swapScreen.transactionDetails.exchangeRate')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 cUSD ≈ 0.58370 CELO'
    )
  })

  it('should render correctly without networkId from the fromToken', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          networkFee={new BigNumber(0.0001)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          slippageInfoBottomSheetRef={{ current: null }}
          feeTokenId={'someId'}
          slippagePercentage={'0.5'}
          fetchingSwapQuote={false}
        />
      </Provider>
    )

    expect(getByText('swapScreen.transactionDetails.networkFeeNoNetwork')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/NetworkFee')).toHaveTextContent('-')
    expect(queryByTestId('SwapTransactionDetails/NetworkFee/MoreInfo')).toBeFalsy()
  })

  it('should render correctly with networkId', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          networkFee={new BigNumber(0.0001)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          slippageInfoBottomSheetRef={{ current: null }}
          feeTokenId={mockCeloTokenId}
          slippagePercentage={'0.5'}
          fromToken={mockCeloTokenBalance}
          fetchingSwapQuote={false}
        />
      </Provider>
    )

    expect(
      getByText('swapScreen.transactionDetails.networkFee, {"networkName":"Celo Alfajores"}')
    ).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/NetworkFee')).toHaveTextContent(
      '₱0.00067 (0.0001 CELO)'
    )
    expect(getByTestId('SwapTransactionDetails/NetworkFee/MoreInfo/Icon')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/NetworkFee/MoreInfo')).not.toBeDisabled()
  })

  it('should render correctly with slippage info', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          networkFee={new BigNumber(0.0001)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          slippageInfoBottomSheetRef={{ current: null }}
          feeTokenId={mockCeloTokenId}
          slippagePercentage={'0.5'}
          fromToken={mockCeloTokenBalance}
          fetchingSwapQuote={false}
        />
      </Provider>
    )

    expect(getByText('swapScreen.transactionDetails.slippagePercentage')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/Slippage')).toHaveTextContent('0.5%')
    expect(getByTestId('SwapTransactionDetails/Slippage/MoreInfo/Icon')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/Slippage/MoreInfo')).not.toBeDisabled()
  })
})

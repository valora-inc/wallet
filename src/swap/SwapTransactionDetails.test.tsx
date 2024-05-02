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
          maxNetworkFee={new BigNumber(0.0001)}
          estimatedNetworkFee={new BigNumber(0.00005)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          slippageInfoBottomSheetRef={{ current: null }}
          exchangeRateInfoBottomSheetRef={{ current: null }}
          feeTokenId={'someId'}
          enableAppFee={false}
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
    expect(getByTestId('SwapTransactionDetails/ExchangeRate/MoreInfo/Icon')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/ExchangeRate/MoreInfo')).not.toBeDisabled()
  })

  it('should render correctly without the fromToken and fees', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          networkFeeInfoBottomSheetRef={{ current: null }}
          slippageInfoBottomSheetRef={{ current: null }}
          exchangeRateInfoBottomSheetRef={{ current: null }}
          feeTokenId={'someId'}
          enableAppFee={false}
          slippagePercentage={'0.5'}
          fetchingSwapQuote={false}
        />
      </Provider>
    )

    expect(getByText('swapScreen.transactionDetails.estimatedNetworkFee')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/EstimatedNetworkFee')).toHaveTextContent('-')
    expect(queryByTestId('SwapTransactionDetails/EstimatedNetworkFee/MoreInfo')).toBeTruthy()

    expect(getByText('swapScreen.transactionDetails.maxNetworkFee')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/MaxNetworkFee')).toHaveTextContent('-')
    expect(queryByTestId('SwapTransactionDetails/MaxNetworkFee/MoreInfo')).toBeTruthy()
  })

  it('should render correctly with fees', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          maxNetworkFee={new BigNumber(0.0001)}
          estimatedNetworkFee={new BigNumber(0.00005)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          slippageInfoBottomSheetRef={{ current: null }}
          exchangeRateInfoBottomSheetRef={{ current: null }}
          feeTokenId={mockCeloTokenId}
          enableAppFee={false}
          slippagePercentage={'0.5'}
          fromToken={mockCeloTokenBalance}
          fetchingSwapQuote={false}
        />
      </Provider>
    )

    expect(getByText('swapScreen.transactionDetails.estimatedNetworkFee')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/EstimatedNetworkFee')).toHaveTextContent(
      '~₱0.00033 (0.00005 CELO)'
    )
    expect(getByTestId('SwapTransactionDetails/EstimatedNetworkFee/MoreInfo/Icon')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/EstimatedNetworkFee/MoreInfo')).not.toBeDisabled()

    expect(getByText('swapScreen.transactionDetails.maxNetworkFee')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/MaxNetworkFee')).toHaveTextContent('0.0001 CELO')
    expect(getByTestId('SwapTransactionDetails/MaxNetworkFee/MoreInfo/Icon')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/MaxNetworkFee/MoreInfo')).not.toBeDisabled()
  })

  it('should render correctly with slippage info', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          maxNetworkFee={new BigNumber(0.0001)}
          estimatedNetworkFee={new BigNumber(0.00005)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          slippageInfoBottomSheetRef={{ current: null }}
          exchangeRateInfoBottomSheetRef={{ current: null }}
          enableAppFee={false}
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

  it('should render correctly when app fee is enabled', () => {
    const { queryByText } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          maxNetworkFee={new BigNumber(0.0001)}
          estimatedNetworkFee={new BigNumber(0.00005)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          slippageInfoBottomSheetRef={{ current: null }}
          exchangeRateInfoBottomSheetRef={{ current: null }}
          enableAppFee={true}
          feeTokenId={mockCeloTokenId}
          slippagePercentage={'0.5'}
          fromToken={mockCeloTokenBalance}
          fetchingSwapQuote={false}
        />
      </Provider>
    )

    // When app fee is enabled, the free swap fee should not be displayed
    // it's part of the exchange rate
    expect(queryByText('swapScreen.transactionDetails.swapFee')).toBeFalsy()
    expect(queryByText('swapScreen.transactionDetails.swapFeeWaived')).toBeFalsy()
  })
})

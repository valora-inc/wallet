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
          appFeeInfoBottomSheetRef={{ current: null }}
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
          appFeeInfoBottomSheetRef={{ current: null }}
          feeTokenId={'someId'}
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
          appFeeInfoBottomSheetRef={{ current: null }}
          feeTokenId={mockCeloTokenId}
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
          appFeeInfoBottomSheetRef={{ current: null }}
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

  it('should render correctly when app fee is >= 0 and token has USD price', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          maxNetworkFee={new BigNumber(0.0001)}
          estimatedNetworkFee={new BigNumber(0.00005)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          slippageInfoBottomSheetRef={{ current: null }}
          exchangeRateInfoBottomSheetRef={{ current: null }}
          appFeeInfoBottomSheetRef={{ current: null }}
          appFee={{
            amount: new BigNumber(0.02),
            token: mockCeloTokenBalance,
            percentage: new BigNumber(7.7),
          }}
          feeTokenId={mockCeloTokenId}
          slippagePercentage={'0.5'}
          fromToken={mockCeloTokenBalance}
          fetchingSwapQuote={false}
        />
      </Provider>
    )

    expect(getByText('swapScreen.transactionDetails.appFee')).toBeTruthy()
    // Content is a bit weird to read here because of the way we render translations in tests
    expect(getByTestId('SwapTransactionDetails/AppFee')).toHaveTextContent(
      'swapScreen.transactionDetails.appFeeValue, {"appFeePercentage":"7.7"}~₱0.130.02 CELO'
    )
  })

  it('should render correctly when app fee is >= 0 and token has no USD price', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          maxNetworkFee={new BigNumber(0.0001)}
          estimatedNetworkFee={new BigNumber(0.00005)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          slippageInfoBottomSheetRef={{ current: null }}
          exchangeRateInfoBottomSheetRef={{ current: null }}
          appFeeInfoBottomSheetRef={{ current: null }}
          appFee={{
            amount: new BigNumber(0.02),
            token: { ...mockCeloTokenBalance, priceUsd: null },
            percentage: new BigNumber(7.7),
          }}
          feeTokenId={mockCeloTokenId}
          slippagePercentage={'0.5'}
          fromToken={mockCeloTokenBalance}
          fetchingSwapQuote={false}
        />
      </Provider>
    )

    expect(getByText('swapScreen.transactionDetails.appFee')).toBeTruthy()
    // Content is a bit weird to read here because of the way we render translations in tests
    expect(getByTestId('SwapTransactionDetails/AppFee')).toHaveTextContent(
      'swapScreen.transactionDetails.appFeeValue, {"context":"withoutPriceUsd","appFeePercentage":"7.7"}0.02 CELO'
    )
  })

  it('should render correctly when app fee is 0', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          maxNetworkFee={new BigNumber(0.0001)}
          estimatedNetworkFee={new BigNumber(0.00005)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          slippageInfoBottomSheetRef={{ current: null }}
          exchangeRateInfoBottomSheetRef={{ current: null }}
          appFeeInfoBottomSheetRef={{ current: null }}
          appFee={{
            amount: new BigNumber(0),
            token: mockCeloTokenBalance,
            percentage: new BigNumber(0),
          }}
          feeTokenId={mockCeloTokenId}
          slippagePercentage={'0.5'}
          fromToken={mockCeloTokenBalance}
          fetchingSwapQuote={false}
        />
      </Provider>
    )

    expect(getByText('swapScreen.transactionDetails.appFee')).toBeTruthy()
    // Content is a bit weird to read here because of the way we render translations in tests
    expect(getByTestId('SwapTransactionDetails/AppFee')).toHaveTextContent(
      'swapScreen.transactionDetails.appFeeValue, {"context":"free","appFeePercentage":"0"}~₱0.000.00 CELO'
    )
  })

  it('should render correctly when app fee is undefined', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          maxNetworkFee={new BigNumber(0.0001)}
          estimatedNetworkFee={new BigNumber(0.00005)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          slippageInfoBottomSheetRef={{ current: null }}
          exchangeRateInfoBottomSheetRef={{ current: null }}
          appFeeInfoBottomSheetRef={{ current: null }}
          appFee={undefined}
          feeTokenId={mockCeloTokenId}
          slippagePercentage={'0.5'}
          fromToken={mockCeloTokenBalance}
          fetchingSwapQuote={false}
        />
      </Provider>
    )

    expect(getByText('swapScreen.transactionDetails.appFee')).toBeTruthy()
    // Content is a bit weird to read here because of the way we render translations in tests
    expect(getByTestId('SwapTransactionDetails/AppFee')).toHaveTextContent(
      'swapScreen.transactionDetails.appFeeValue, {"context":"placeholder","appFeePercentage":"0"}'
    )
  })
})

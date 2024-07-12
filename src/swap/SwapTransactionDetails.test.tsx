import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import SwapTransactionDetails from 'src/swap/SwapTransactionDetails'
import { AppFeeAmount, SwapFeeAmount } from 'src/swap/types'
import { createMockStore } from 'test/utils'
import {
  mockCeloTokenBalance,
  mockCusdTokenBalance,
  mockCusdTokenId,
  mockTokenBalances,
} from 'test/values'

const defaultProps = {
  feeInfoBottomSheetRef: { current: null },
  slippageInfoBottomSheetRef: { current: null },
  exchangeRateInfoBottomSheetRef: { current: null },
  estimatedDurationBottomSheetRef: { current: null },
  slippagePercentage: '0.5',
  fetchingSwapQuote: false,
  fromToken: {
    ...mockTokenBalances[mockCusdTokenId],
    lastKnownPriceUsd: null,
    balance: BigNumber('10'),
    priceUsd: BigNumber('1'),
  },
  toToken: mockCeloTokenBalance,
  exchangeRatePrice: '0.5837',
}

describe('SwapTransactionDetails', () => {
  it('should render the correct exchange rate and estimated value', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails {...defaultProps} swapAmount={BigNumber('1')} />
      </Provider>
    )

    expect(getByText('swapScreen.transactionDetails.exchangeRate')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 cUSD ≈ 0.58370 CELO'
    )
    expect(getByTestId('SwapTransactionDetails/ExchangeRate/MoreInfo/Icon')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/ExchangeRate/MoreInfo')).not.toBeDisabled()
  })

  it('should render correctly with estimated duration', () => {
    const { getByText } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails {...defaultProps} estimatedDurationInSeconds={800} />
      </Provider>
    )

    expect(getByText('swapScreen.transactionDetails.estimatedTransactionTime')).toBeTruthy()
    expect(
      getByText('swapScreen.transactionDetails.estimatedTransactionTimeInMinutes, {"minutes":14}')
    ).toBeTruthy()
  })

  describe('total fees', () => {
    const mockNetworkFee: SwapFeeAmount = {
      amount: new BigNumber(0.01),
      token: mockCusdTokenBalance,
      maxAmount: new BigNumber(0.02),
    }
    const mockCrossChainFee: SwapFeeAmount = {
      amount: new BigNumber(1.3),
      token: mockCeloTokenBalance,
      maxAmount: new BigNumber(1.7),
    }
    const mockAppFee: AppFeeAmount = {
      amount: new BigNumber(0.07),
      token: mockCeloTokenBalance,
      percentage: new BigNumber(0.6),
    }

    // the fee components are calculated from the mock fee objects. the
    // calculation is amount * token price usd * local currency exchange rate
    // (1.33).
    // expectedNetworkFeeInLocalCurrency = 0.01 * 1.001 * 1.33 = 0.0133133
    // expectedCrossChainFeeInLocalCurrency = 1.3 * 0.5 * 1.33 = 0.8645
    // expectedAppFeeInLocalCurrency = 0.07 * 0.5 * 1.33 = 0.04655

    it.each`
      feeName            | feeValue
      ${'networkFee'}    | ${{ ...mockNetworkFee, token: undefined }}
      ${'appFee'}        | ${{ ...mockAppFee, token: undefined }}
      ${'crossChainFee'} | ${{ ...mockCrossChainFee, token: undefined }}
    `(
      'should render a fallback message if the $feeName token info is missing',
      ({ feeName, feeValue }) => {
        const testProps = { [feeName]: feeValue }
        const { getByTestId } = render(
          <Provider store={createMockStore()}>
            <SwapTransactionDetails
              {...defaultProps}
              crossChainFee={mockCrossChainFee}
              networkFee={mockNetworkFee}
              appFee={mockAppFee}
              {...testProps}
            />
          </Provider>
        )

        expect(getByTestId('SwapTransactionDetails/Fees')).toHaveTextContent(
          'swapScreen.transactionDetails.feesCalculationError'
        )
      }
    )

    it('should render the total fees in fiat', () => {
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <SwapTransactionDetails
            {...defaultProps}
            networkFee={mockNetworkFee}
            appFee={mockAppFee}
            crossChainFee={mockCrossChainFee}
          />
        </Provider>
      )

      expect(getByTestId('SwapTransactionDetails/Fees')).toHaveTextContent('≈ ₱0.92')
    })

    it('should render the total fees with fiat and token values when priceUsd is missing', () => {
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <SwapTransactionDetails
            {...defaultProps}
            networkFee={mockNetworkFee}
            appFee={{
              ...mockAppFee,
              token: {
                ...mockCeloTokenBalance,
                priceUsd: null,
              },
            }}
          />
        </Provider>
      )

      expect(getByTestId('SwapTransactionDetails/Fees')).toHaveTextContent('≈ ₱0.013 + 0.07 CELO')
    })

    it('should render the total fees in only token values when all priceUsd is missing', () => {
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <SwapTransactionDetails
            {...defaultProps}
            networkFee={{
              ...mockNetworkFee,
              token: {
                ...mockCusdTokenBalance,
                priceUsd: null,
              },
            }}
            appFee={{
              ...mockAppFee,
              token: {
                ...mockCeloTokenBalance,
                priceUsd: null,
              },
            }}
            crossChainFee={{
              ...mockCrossChainFee,
              token: {
                ...mockCeloTokenBalance,
                priceUsd: null,
              },
            }}
          />
        </Provider>
      )

      expect(getByTestId('SwapTransactionDetails/Fees')).toHaveTextContent(
        '≈ 1.37 CELO + 0.01 cUSD'
      )
    })

    it.each`
      feeName            | expectedTotalFee
      ${'appFee'}        | ${`≈ ₱0.88`}
      ${'crossChainFee'} | ${`≈ ₱0.06`}
    `(
      'should render the total fees when the $feeName is undefined',
      ({ feeName, expectedTotalFee }) => {
        const testProps = { [feeName]: undefined }
        const { getByTestId } = render(
          <Provider store={createMockStore()}>
            <SwapTransactionDetails
              {...defaultProps}
              crossChainFee={mockCrossChainFee}
              networkFee={mockNetworkFee}
              appFee={mockAppFee}
              {...testProps}
            />
          </Provider>
        )

        expect(getByTestId('SwapTransactionDetails/Fees')).toHaveTextContent(expectedTotalFee)
      }
    )
  })
})

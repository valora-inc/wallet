import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import SwapTransactionDetails from 'src/swap/SwapTransactionDetails'
import { createMockStore } from 'test/utils'
import { mockCeloTokenBalance, mockCeloTokenId } from 'test/values'

describe('SwapTransactionDetails', () => {
  it('should render correctly without networkId from the fromToken', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          networkFee={new BigNumber(0.0001)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          feeTokenId={'someId'}
          slippagePercentage={'0.5'}
          fetchingSwapQuote={false}
        />
      </Provider>
    )

    expect(getByText('swapScreen.transactionDetails.networkFeeNoNetwork')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/NetworkFee/Value')).toHaveTextContent('-')
    expect(queryByTestId('SwapTransactionDetails/NetworkFee/MoreInfo')).toBeFalsy()
  })

  it('should render correctly with networkId', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          networkFee={new BigNumber(0.0001)}
          networkFeeInfoBottomSheetRef={{ current: null }}
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
    expect(getByTestId('SwapTransactionDetails/NetworkFee/FiatValue')).toHaveTextContent('₱0.00067')
    expect(getByTestId('SwapTransactionDetails/NetworkFee/Value')).toHaveTextContent('0.0001 CELO')
    expect(getByTestId('SwapTransactionDetails/NetworkFee/MoreInfo/Icon')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/NetworkFee/MoreInfo')).not.toBeDisabled()
  })
})

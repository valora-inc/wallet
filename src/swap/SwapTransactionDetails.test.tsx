import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import SwapTransactionDetails from 'src/swap/SwapTransactionDetails'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'

describe('SwapTransactionDetails', () => {
  it('should render correctly without networkId', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          networkId={undefined}
          networkFee={new BigNumber(0.0001)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          feeTokenId={'someId'}
          slippagePercentage={0.5}
        />
      </Provider>
    )

    expect(getByText('swapScreen.transactionDetails.networkFeeNoNetwork')).toBeTruthy()
    expect(queryByTestId('SwapTransactionDetails/NetworkFeeMoreInfo/Icon')).toBeFalsy()
    expect(getByTestId('SwapTransactionDetails/NetworkFeeMoreInfo')).toBeDisabled()
  })

  it('should render correctly with networkId', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapTransactionDetails
          networkId={networkConfig.defaultNetworkId}
          networkFee={new BigNumber(0.0001)}
          networkFeeInfoBottomSheetRef={{ current: null }}
          feeTokenId={'someId'}
          slippagePercentage={0.5}
        />
      </Provider>
    )

    expect(
      getByText('swapScreen.transactionDetails.networkFee, {"networkName":"Celo Alfajores"}')
    ).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/NetworkFeeMoreInfo/Icon')).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/NetworkFeeMoreInfo')).not.toBeDisabled()
  })
})

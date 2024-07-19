import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import PoolCard from 'src/earn/PoolCard'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import { mockArbEthTokenId, mockArbUsdcTokenId, mockTokenBalances } from 'test/values'

describe('PoolCard', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <PoolCard
          pool={{
            poolId: 'pool1',
            networkId: NetworkId['arbitrum-sepolia'],
            tokens: [mockArbUsdcTokenId, mockArbEthTokenId],
            depositTokenId: mockArbUsdcTokenId,
            poolTokenId: mockArbEthTokenId,
            provider: 'Test',
            apy: 0.033,
            reward: 0,
            tvl: 1360000,
            poolAddress: '0xvault',
          }}
        />
      </Provider>
    )

    expect(getByText('USDC / ETH')).toBeTruthy()
    expect(
      getByText('earnFlow.poolCard.onNetwork, {"networkName":"Arbitrum Sepolia"}')
    ).toBeTruthy()
    expect(getByText('earnFlow.poolCard.apy, {"apy":"3.30"}')).toBeTruthy()
    expect(getByText('0.00%')).toBeTruthy()
    expect(getByText('$1,360,000')).toBeTruthy()
  })

  it('navigates to enter amount', () => {
    const { getByText } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <PoolCard
          pool={{
            poolId: 'pool1',
            networkId: NetworkId['arbitrum-sepolia'],
            tokens: [mockArbUsdcTokenId, mockArbEthTokenId],
            depositTokenId: mockArbUsdcTokenId,
            poolTokenId: mockArbEthTokenId,
            provider: 'Test',
            apy: 0.033,
            reward: 0,
            tvl: 1360000,
            poolAddress: '0xvault',
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.poolCard.addToPool')).toBeTruthy()
    fireEvent.press(getByText('earnFlow.poolCard.addToPool'))
    expect(navigate).toHaveBeenCalledWith(Screens.EarnEnterAmount, { tokenId: mockArbUsdcTokenId })
  })
})

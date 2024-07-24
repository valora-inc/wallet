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

  it('navigates to enter amount when no pool balance', () => {
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
  
  it('navigates to enter amount when have pool balance', () => {
    const { getByText } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              ...mockTokenBalances,
              [mockArbEthTokenId]: {
                name: 'Ethereum',
                networkId: NetworkId['arbitrum-sepolia'],
                tokenId: mockArbEthTokenId,
                address: null,
                symbol: 'ETH',
                decimals: 18,
                imageUrl:
                  'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/ETH.png',
                balance: '10',
                priceUsd: '1500',
                isNative: true,
                priceFetchedAt: Date.now(),
              },
            },
          },
        })}
      >
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
  it('navigates to collect screen', () => {
    const { getByText } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              ...mockTokenBalances,
              [mockArbEthTokenId]: {
                name: 'Ethereum',
                networkId: NetworkId['arbitrum-sepolia'],
                tokenId: mockArbEthTokenId,
                address: null,
                symbol: 'ETH',
                decimals: 18,
                imageUrl:
                  'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/ETH.png',
                balance: '10',
                priceUsd: '1500',
                isNative: true,
                priceFetchedAt: Date.now(),
              },
            },
          },
        })}
      >
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

    expect(getByText('earnFlow.poolCard.exitPool')).toBeTruthy()
    fireEvent.press(getByText('earnFlow.poolCard.exitPool'))
    expect(navigate).toHaveBeenCalledWith(Screens.EarnCollectScreen, {
      depositTokenId: mockArbUsdcTokenId,
      poolTokenId: mockArbEthTokenId,
    })
  })
})

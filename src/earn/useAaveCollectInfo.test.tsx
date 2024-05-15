import { renderHook, waitFor } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import { fetchAavePoolInfo, fetchAaveRewards } from 'src/earn/aaveInfo'
import { useAaveCollectInfo } from 'src/earn/useAaveCollectInfo'
import { StoredTokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import { mockAccount, mockAccount2, mockAccount3, mockArbArbitrumTokenBalance } from 'test/values'

jest.mock('src/earn/aaveInfo', () => ({
  fetchAavePoolInfo: jest.fn(),
  fetchAaveRewards: jest.fn(),
}))

const mockAaveTokenBalances = {
  [networkConfig.arbUsdcTokenId]: {
    name: 'USDC',
    networkId: NetworkId['arbitrum-sepolia'],
    tokenId: networkConfig.arbUsdcTokenId,
    address: mockAccount2,
    symbol: 'USDC',
    decimals: 6,
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/ETH.png',
    balance: '2',
    priceUsd: '1',
    priceFetchedAt: Date.now(),
  },
  [networkConfig.aaveArbUsdcTokenId]: {
    name: 'aUSDC',
    networkId: NetworkId['arbitrum-sepolia'],
    tokenId: networkConfig.aaveArbUsdcTokenId,
    address: mockAccount3,
    symbol: 'aUSDC',
    decimals: 6,
    imageUrl:
      'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/ETH.png',
    balance: '3',
    priceUsd: '1',
    priceFetchedAt: Date.now(),
  },
}

const mockArbUsdcTokenBalance = {
  ...mockAaveTokenBalances[networkConfig.arbUsdcTokenId],
  priceUsd: new BigNumber(1),
  lastKnownPriceUsd: new BigNumber(1),
  balance: new BigNumber(2),
}

const mockAaveArbUsdcTokenBalance = {
  ...mockAaveTokenBalances[networkConfig.aaveArbUsdcTokenId],
  priceUsd: new BigNumber(1),
  lastKnownPriceUsd: new BigNumber(1),
  balance: new BigNumber(3),
}

const renderHookWithProvider = ({
  walletAddress = mockAccount,
  tokenBalances = mockAaveTokenBalances,
}: {
  walletAddress: string | undefined
  tokenBalances: Record<string, StoredTokenBalance>
}) => {
  const store = createMockStore({
    web3: {
      account: walletAddress,
    },
    tokens: {
      tokenBalances,
    },
  })

  return renderHook(() => useAaveCollectInfo(), {
    wrapper: (component) => (
      <Provider store={store}>{component?.children ? component.children : component}</Provider>
    ),
  })
}

describe('useAaveCollectInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(fetchAavePoolInfo).mockResolvedValue({ apy: 0.036 })
    jest.mocked(fetchAaveRewards).mockResolvedValue([
      {
        amount: new BigNumber('0.01'),
        tokenInfo: mockArbArbitrumTokenBalance,
      },
    ])
  })
  it('should return aave collect info', async () => {
    const { result } = renderHookWithProvider({
      walletAddress: mockAccount,
      tokenBalances: mockAaveTokenBalances,
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.error).toBeUndefined()
    expect(result.current.result).toMatchObject({
      tokenInfo: mockArbUsdcTokenBalance,
      poolTokenInfo: mockAaveArbUsdcTokenBalance,
      poolApy: '3.60',
      rewardsInfo: [
        {
          amount: new BigNumber('0.01'),
          tokenInfo: mockArbArbitrumTokenBalance,
        },
      ],
    })
  })

  // TODO: add tests for error cases
})

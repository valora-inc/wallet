import { render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import EarnCollectScreen from 'src/earn/EarnCollectScreen'
import { fetchAavePoolInfo, fetchAaveRewards } from 'src/earn/poolInfo'
import { NetworkId } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import {
  mockAaveArbUsdcAddress,
  mockArbArbTokenBalance,
  mockArbArbTokenId,
  mockArbUsdcTokenId,
  mockTokenBalances,
} from 'test/values'

const store = createMockStore({
  tokens: {
    tokenBalances: {
      ...mockTokenBalances,
      [networkConfig.aaveArbUsdcTokenId]: {
        networkId: NetworkId['arbitrum-sepolia'],
        address: mockAaveArbUsdcAddress,
        tokenId: networkConfig.aaveArbUsdcTokenId,
        symbol: 'aArbSepUSDC',
        priceUsd: '1',
        balance: '10.75',
        priceFetchedAt: Date.now(),
      },
    },
  },
})

jest.mock('src/earn/poolInfo')

describe('EarnCollectScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(fetchAavePoolInfo).mockResolvedValue({ apy: 0.03 })
    jest
      .mocked(fetchAaveRewards)
      .mockResolvedValue([{ amount: '0.01', tokenInfo: mockArbArbTokenBalance }])
  })

  it('renders total balance, rewards and apy', async () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnCollectScreen}
          params={{
            depositTokenId: mockArbUsdcTokenId,
            poolTokenId: networkConfig.aaveArbUsdcTokenId,
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.collect.title')).toBeTruthy()
    expect(getByText('earnFlow.collect.total')).toBeTruthy()
    expect(getByTestId(`EarnCollect/${mockArbUsdcTokenId}/CryptoAmount`)).toHaveTextContent(
      '10.75 USDC'
    )
    expect(getByTestId(`EarnCollect/${mockArbUsdcTokenId}/FiatAmount`)).toHaveTextContent('₱14.30')
    expect(getByTestId('EarnCollect/RewardsLoading')).toBeTruthy()
    expect(getByTestId('EarnCollect/ApyLoading')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/RewardsLoading')).toBeFalsy()
    })
    await waitFor(() => {
      expect(queryByTestId('EarnCollect/ApyLoading')).toBeFalsy()
    })
    expect(getByText('earnFlow.collect.plus')).toBeTruthy()
    expect(getByTestId(`EarnCollect/${mockArbArbTokenId}/CryptoAmount`)).toHaveTextContent(
      '0.01 ARB'
    )
    expect(getByTestId(`EarnCollect/${mockArbArbTokenId}/FiatAmount`)).toHaveTextContent('₱0.016')
    expect(getByTestId('EarnCollectScreen/CTA')).toBeEnabled()

    expect(getByText('earnFlow.collect.apy, {"apy":"3.00"}')).toBeTruthy()
  })

  it('skips rewards section when no rewards', async () => {
    jest.mocked(fetchAaveRewards).mockResolvedValue([])
    const { getByText, getByTestId, queryByTestId, queryByText } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnCollectScreen}
          params={{
            depositTokenId: mockArbUsdcTokenId,
            poolTokenId: networkConfig.aaveArbUsdcTokenId,
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.collect.title')).toBeTruthy()
    expect(getByText('earnFlow.collect.total')).toBeTruthy()
    expect(getByTestId(`EarnCollect/${mockArbUsdcTokenId}/CryptoAmount`)).toHaveTextContent(
      '10.75 USDC'
    )
    expect(getByTestId(`EarnCollect/${mockArbUsdcTokenId}/FiatAmount`)).toHaveTextContent('₱14.30')
    expect(getByTestId('EarnCollect/RewardsLoading')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/RewardsLoading')).toBeFalsy()
    })
    expect(queryByText('earnFlow.collect.plus')).toBeFalsy()
    expect(queryByTestId(`EarnCollect/${mockArbArbTokenId}/CryptoAmount`)).toBeFalsy()
    expect(queryByTestId(`EarnCollect/${mockArbArbTokenId}/FiatAmount`)).toBeFalsy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeEnabled()
  })

  it('shows error and keeps cta disabled if rewards loading fails', async () => {
    jest.mocked(fetchAaveRewards).mockRejectedValue(new Error('Failed to fetch rewards'))
    const { getByText, getByTestId, queryByText, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnCollectScreen}
          params={{
            depositTokenId: mockArbUsdcTokenId,
            poolTokenId: networkConfig.aaveArbUsdcTokenId,
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.collect.title')).toBeTruthy()
    expect(getByText('earnFlow.collect.total')).toBeTruthy()
    expect(getByTestId('EarnCollect/RewardsLoading')).toBeTruthy()
    expect(getByTestId('EarnCollect/ApyLoading')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/RewardsLoading')).toBeFalsy()
    })
    await waitFor(() => {
      expect(queryByTestId('EarnCollect/ApyLoading')).toBeFalsy()
    })
    expect(getByText('earnFlow.collect.errorTitle')).toBeTruthy()
    expect(queryByText('earnFlow.collect.plus')).toBeFalsy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()
  })

  it('skips error and enables cta if only apy loading fails', async () => {
    jest.mocked(fetchAavePoolInfo).mockRejectedValue(new Error('Failed to fetch apy'))
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnCollectScreen}
          params={{
            depositTokenId: mockArbUsdcTokenId,
            poolTokenId: networkConfig.aaveArbUsdcTokenId,
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.collect.title')).toBeTruthy()
    expect(getByText('earnFlow.collect.total')).toBeTruthy()
    expect(getByTestId('EarnCollect/RewardsLoading')).toBeTruthy()
    expect(getByTestId('EarnCollect/ApyLoading')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/ApyLoading')).toBeFalsy()
    })
    expect(getByText('earnFlow.collect.apy, {"apy":"--"}')).toBeTruthy()
    expect(getByText('earnFlow.collect.plus')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeEnabled()
  })
})

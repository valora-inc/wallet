import { fireEvent, render, waitFor } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnCollectScreen from 'src/earn/EarnCollectScreen'
import { prepareWithdrawAndClaimTransactions } from 'src/earn/prepareTransactions'
import { withdrawStart } from 'src/earn/slice'
import { isGasSubsidizedForNetwork } from 'src/earn/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import { PreparedTransactionsPossible } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore, mockStoreBalancesToTokenBalances } from 'test/utils'
import {
  mockAaveArbUsdcAddress,
  mockAccount,
  mockArbArbTokenId,
  mockArbEthTokenId,
  mockArbUsdcTokenId,
  mockEarnPositions,
  mockPositions,
  mockRewardsPositions,
  mockTokenBalances,
} from 'test/values'

const mockStoreTokens = {
  tokenBalances: {
    ...mockTokenBalances,
    [`${NetworkId['arbitrum-sepolia']}:0x460b97bd498e1157530aeb3086301d5225b91216`]: {
      networkId: NetworkId['arbitrum-sepolia'],
      address: mockAaveArbUsdcAddress,
      tokenId: `${NetworkId['arbitrum-sepolia']}:0x460b97bd498e1157530aeb3086301d5225b91216`,
      symbol: 'aArbSepUSDC',
      priceUsd: '1',
      balance: '10.75',
      priceFetchedAt: Date.now(),
    },
  },
}

const store = createMockStore({
  tokens: mockStoreTokens,
  positions: {
    positions: [...mockPositions, ...mockRewardsPositions],
  },
})

jest.mock('src/statsig')
jest.mock('src/earn/utils')
jest.mock('src/earn/prepareTransactions')
jest.mock('src/earn/poolInfo')

const mockPreparedTransaction: PreparedTransactionsPossible = {
  type: 'possible' as const,
  transactions: [
    {
      from: '0xfrom',
      to: '0xto',
      data: '0xdata',
      gas: BigInt(5e16),
      _baseFeePerGas: BigInt(1),
      maxFeePerGas: BigInt(1),
      maxPriorityFeePerGas: undefined,
    },
    {
      from: '0xfrom',
      to: '0xto',
      data: '0xdata',
      gas: BigInt(1e16),
      _baseFeePerGas: BigInt(1),
      maxFeePerGas: BigInt(1),
      maxPriorityFeePerGas: undefined,
    },
  ],
  feeCurrency: {
    ...mockTokenBalances[mockArbEthTokenId],
    balance: new BigNumber(10),
    priceUsd: new BigNumber(1),
    lastKnownPriceUsd: new BigNumber(1),
  },
}

describe('EarnCollectScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.mocked(prepareWithdrawAndClaimTransactions).mockResolvedValue(mockPreparedTransaction)
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (gateName: StatsigFeatureGates) => gateName === StatsigFeatureGates.SHOW_POSITIONS
      )
    jest.mocked(isGasSubsidizedForNetwork).mockReturnValue(false)
    store.clearActions()
  })

  it('renders total balance, rewards, apy and gas after fetching rewards and preparing tx', async () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnCollectScreen}
          params={{
            pool: mockEarnPositions[0],
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.collect.title')).toBeTruthy()
    expect(getByText('earnFlow.collect.total')).toBeTruthy()
    expect(getByTestId(`EarnCollect/${mockArbUsdcTokenId}/CryptoAmount`)).toHaveTextContent(
      '11.83 USDC'
    )
    expect(getByTestId(`EarnCollect/${mockArbUsdcTokenId}/FiatAmount`)).toHaveTextContent('₱15.73')
    expect(queryByTestId('EarnCollect/ApyLoading')).toBeFalsy()
    expect(getByTestId('EarnCollect/GasLoading')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()

    expect(getByText('earnFlow.collect.plus')).toBeTruthy()
    expect(getByTestId(`EarnCollect/${mockArbArbTokenId}/CryptoAmount`)).toHaveTextContent(
      '0.01 ARB'
    )
    expect(getByTestId(`EarnCollect/${mockArbArbTokenId}/FiatAmount`)).toHaveTextContent('₱0.016')
    expect(getByText('earnFlow.collect.apy, {"apy":"1.92"}')).toBeTruthy()

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/GasLoading')).toBeFalsy()
    })
    expect(getByTestId('EarnCollect/GasFeeCryptoAmount')).toHaveTextContent('0.06 ETH')
    expect(getByTestId('EarnCollect/GasFeeFiatAmount')).toHaveTextContent('₱119.70')
    expect(queryByTestId('EarnCollect/GasSubsidized')).toBeFalsy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeEnabled()
    expect(prepareWithdrawAndClaimTransactions).toHaveBeenCalledWith({
      feeCurrencies: mockStoreBalancesToTokenBalances([mockTokenBalances[mockArbEthTokenId]]),
      pool: mockEarnPositions[0],
      rewardsPositions: [mockRewardsPositions[1]],
      walletAddress: mockAccount.toLowerCase(),
      hooksApiUrl: 'https://api.alfajores.valora.xyz/hooks-api',
    })
    expect(store.getActions()).toEqual([])
  })

  it('skips rewards section when no rewards', async () => {
    const { getByText, getByTestId, queryByTestId, queryByText } = render(
      <Provider
        store={createMockStore({
          tokens: mockStoreTokens,
          positions: {
            positions: [...mockPositions, ...mockRewardsPositions].filter(
              (position) =>
                position.positionId !==
                'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216:supply-incentives'
            ),
          },
        })}
      >
        <MockedNavigator
          component={EarnCollectScreen}
          params={{
            pool: mockEarnPositions[0],
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.collect.title')).toBeTruthy()
    expect(getByText('earnFlow.collect.total')).toBeTruthy()
    expect(getByTestId(`EarnCollect/${mockArbUsdcTokenId}/CryptoAmount`)).toHaveTextContent(
      '11.83 USDC'
    )
    expect(getByTestId(`EarnCollect/${mockArbUsdcTokenId}/FiatAmount`)).toHaveTextContent('₱15.73')
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()

    expect(queryByText('earnFlow.collect.plus')).toBeFalsy()
    expect(queryByTestId(`EarnCollect/${mockArbArbTokenId}/CryptoAmount`)).toBeFalsy()
    expect(queryByTestId(`EarnCollect/${mockArbArbTokenId}/FiatAmount`)).toBeFalsy()
    await waitFor(() => {
      expect(queryByTestId('EarnCollectScreen/CTA')).toBeEnabled()
    })
    await waitFor(() => {
      expect(queryByTestId('EarnCollect/GasLoading')).toBeFalsy()
    })
  })

  it('shows error and keeps cta disabled if prepare tx fails', async () => {
    jest
      .mocked(prepareWithdrawAndClaimTransactions)
      .mockRejectedValue(new Error('Failed to prepare'))
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnCollectScreen}
          params={{
            pool: mockEarnPositions[0],
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.collect.title')).toBeTruthy()
    expect(getByText('earnFlow.collect.total')).toBeTruthy()
    expect(getByTestId('EarnCollect/GasLoading')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/GasLoading')).toBeFalsy()
    })
    expect(getByText('earnFlow.collect.errorTitle')).toBeTruthy()
    expect(getByTestId('EarnCollect/GasError')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()
  })

  it('disables cta if not enough balance for gas', async () => {
    jest.mocked(prepareWithdrawAndClaimTransactions).mockResolvedValue({
      type: 'not-enough-balance-for-gas',
      feeCurrencies: [mockPreparedTransaction.feeCurrency],
    })
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnCollectScreen}
          params={{
            pool: mockEarnPositions[0],
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.collect.title')).toBeTruthy()
    expect(getByText('earnFlow.collect.total')).toBeTruthy()
    expect(getByTestId('EarnCollect/GasLoading')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/GasLoading')).toBeFalsy()
    })
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()
    expect(getByTestId('EarnCollect/GasError')).toBeTruthy()
  })

  it('pressing cta dispatches withdraw action and fires analytics event', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnCollectScreen}
          params={{
            pool: mockEarnPositions[0],
          }}
        />
      </Provider>
    )

    await waitFor(() => {
      expect(getByTestId('EarnCollectScreen/CTA')).toBeEnabled()
    })

    fireEvent.press(getByTestId('EarnCollectScreen/CTA'))

    expect(store.getActions()).toEqual([
      {
        type: withdrawStart.type,
        payload: {
          pool: mockEarnPositions[0],
          preparedTransactions: getSerializablePreparedTransactions(
            mockPreparedTransaction.transactions
          ),
          rewardsTokens: mockRewardsPositions[1].tokens,
        },
      },
    ])

    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_collect_earnings_press, {
      depositTokenId: mockArbUsdcTokenId,
      tokenAmount: '11.825',
      networkId: NetworkId['arbitrum-sepolia'],
      providerId: mockEarnPositions[0].appId,
      rewards: [{ amount: '0.01', tokenId: mockArbArbTokenId }],
      poolId: mockEarnPositions[0].positionId,
    })
  })

  it('disables cta and shows loading spinner when withdraw is submitted', async () => {
    const store = createMockStore({
      earn: { withdrawStatus: 'loading' },
      tokens: mockStoreTokens,
      positions: {
        positions: [...mockPositions, ...mockRewardsPositions],
      },
    })
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnCollectScreen}
          params={{
            pool: mockEarnPositions[0],
          }}
        />
      </Provider>
    )

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/GasLoading')).toBeFalsy()
    })

    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()
    expect(getByTestId('EarnCollectScreen/CTA')).toContainElement(getByTestId('Button/Loading'))
  })

  it('navigate and fire analytics on no gas CTA press', async () => {
    jest.mocked(prepareWithdrawAndClaimTransactions).mockResolvedValue({
      type: 'not-enough-balance-for-gas',
      feeCurrencies: [mockPreparedTransaction.feeCurrency],
    })

    const { getByText, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnCollectScreen}
          params={{
            pool: mockEarnPositions[0],
          }}
        />
      </Provider>
    )

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/RewardsLoading')).toBeFalsy()
    })

    expect(
      getByText('earnFlow.collect.noGasCta, {"symbol":"ETH","network":"Arbitrum Sepolia"}')
    ).toBeTruthy()
    fireEvent.press(
      getByText('earnFlow.collect.noGasCta, {"symbol":"ETH","network":"Arbitrum Sepolia"}')
    )

    expect(navigate).toBeCalledWith(Screens.FiatExchangeAmount, {
      flow: 'CashIn',
      tokenId: mockArbEthTokenId,
      tokenSymbol: 'ETH',
    })
    expect(AppAnalytics.track).toBeCalledWith(EarnEvents.earn_withdraw_add_gas_press, {
      gasTokenId: mockArbEthTokenId,
      networkId: NetworkId['arbitrum-sepolia'],
      poolId: mockEarnPositions[0].positionId,
      providerId: mockEarnPositions[0].appId,
      depositTokenId: mockArbUsdcTokenId,
    })
  })

  it('shows gas subsidized copy when feature gate is true', async () => {
    jest.mocked(isGasSubsidizedForNetwork).mockReturnValue(true)

    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnCollectScreen}
          params={{
            pool: mockEarnPositions[0],
          }}
        />
      </Provider>
    )
    expect(getByTestId('EarnCollect/GasSubsidized')).toBeTruthy()
  })
})

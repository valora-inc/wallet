import { fireEvent, render, waitFor } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import EarnCollectScreen from 'src/earn/EarnCollectScreen'
import { fetchAavePoolInfo, fetchAaveRewards } from 'src/earn/poolInfo'
import { prepareWithdrawAndClaimTransactions } from 'src/earn/prepareTransactions'
import { withdrawStart } from 'src/earn/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import { PreparedTransactionsPossible } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import networkConfig from 'src/web3/networkConfig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore, mockStoreBalancesToTokenBalances } from 'test/utils'
import {
  mockAaveArbUsdcAddress,
  mockAccount,
  mockArbArbTokenBalance,
  mockArbArbTokenId,
  mockArbEthTokenId,
  mockArbUsdcTokenId,
  mockTokenBalances,
} from 'test/values'

const mockStoreTokens = {
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
}

const store = createMockStore({ tokens: mockStoreTokens })

jest.mock('src/earn/poolInfo')
jest.mock('src/statsig')
jest.mock('src/earn/prepareTransactions')

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

const mockRewards = [{ amount: '0.01', tokenInfo: mockArbArbTokenBalance }]

describe('EarnCollectScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(fetchAavePoolInfo).mockResolvedValue({ apy: 0.03 })
    jest.mocked(fetchAaveRewards).mockResolvedValue(mockRewards)
    jest.mocked(prepareWithdrawAndClaimTransactions).mockResolvedValue(mockPreparedTransaction)
    jest.mocked(getFeatureGate).mockReturnValue(false)
    store.clearActions()
  })

  it('renders total balance, rewards, apy and gas after fetching rewards and preparing tx', async () => {
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
    expect(getByTestId('EarnCollect/GasLoading')).toBeTruthy()
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
    expect(getByText('earnFlow.collect.apy, {"apy":"3.00"}')).toBeTruthy()

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/GasLoading')).toBeFalsy()
    })
    expect(getByTestId('EarnCollect/GasFeeCryptoAmount')).toHaveTextContent('0.06 ETH')
    expect(getByTestId('EarnCollect/GasFeeFiatAmount')).toHaveTextContent('₱119.70')
    expect(queryByTestId('EarnCollect/GasSubsidized')).toBeFalsy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeEnabled()
    expect(prepareWithdrawAndClaimTransactions).toHaveBeenCalledWith({
      amount: '10.75',
      feeCurrencies: mockStoreBalancesToTokenBalances([mockTokenBalances[mockArbEthTokenId]]),
      poolTokenAddress: mockAaveArbUsdcAddress,
      rewards: mockRewards,
      token: mockStoreBalancesToTokenBalances([mockTokenBalances[mockArbUsdcTokenId]])[0],
      walletAddress: mockAccount.toLowerCase(),
    })
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

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/GasLoading')).toBeFalsy()
    })
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
    expect(getByTestId('EarnCollect/GasLoading')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/RewardsLoading')).toBeFalsy()
    })
    await waitFor(() => {
      expect(queryByTestId('EarnCollect/ApyLoading')).toBeFalsy()
    })
    await waitFor(() => {
      expect(queryByTestId('EarnCollect/GasLoading')).toBeFalsy()
    })
    expect(getByText('earnFlow.collect.errorTitle')).toBeTruthy()
    expect(queryByText('earnFlow.collect.plus')).toBeFalsy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()
    expect(prepareWithdrawAndClaimTransactions).not.toHaveBeenCalled()
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
    expect(getByTestId('EarnCollect/GasLoading')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/RewardsLoading')).toBeFalsy()
    })
    await waitFor(() => {
      expect(queryByTestId('EarnCollect/ApyLoading')).toBeFalsy()
    })
    await waitFor(() => {
      expect(queryByTestId('EarnCollect/GasLoading')).toBeFalsy()
    })
    expect(getByText('earnFlow.collect.errorTitle')).toBeTruthy()
    expect(getByTestId('EarnCollect/GasError')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()
  })

  it('skips error and enables cta if only apy loading fails', async () => {
    jest.mocked(fetchAavePoolInfo).mockRejectedValue(new Error('Failed to fetch apy'))
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
    expect(getByTestId('EarnCollect/RewardsLoading')).toBeTruthy()
    expect(getByTestId('EarnCollect/ApyLoading')).toBeTruthy()
    expect(getByTestId('EarnCollect/GasLoading')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/RewardsLoading')).toBeFalsy()
    })
    await waitFor(() => {
      expect(queryByTestId('EarnCollect/ApyLoading')).toBeFalsy()
    })
    await waitFor(() => {
      expect(queryByTestId('EarnCollect/GasLoading')).toBeFalsy()
    })
    expect(getByText('earnFlow.collect.apy, {"apy":"--"}')).toBeTruthy()
    expect(getByText('earnFlow.collect.plus')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeEnabled()
    expect(queryByText('earnFlow.collect.errorTitle')).toBeFalsy()
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
    expect(getByTestId('EarnCollect/GasLoading')).toBeTruthy()
    expect(getByTestId('EarnCollectScreen/CTA')).toBeDisabled()

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/RewardsLoading')).toBeFalsy()
    })
    await waitFor(() => {
      expect(queryByTestId('EarnCollect/ApyLoading')).toBeFalsy()
    })
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
            depositTokenId: mockArbUsdcTokenId,
            poolTokenId: networkConfig.aaveArbUsdcTokenId,
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
          amount: '10.75',
          tokenId: mockArbUsdcTokenId,
          preparedTransactions: getSerializablePreparedTransactions(
            mockPreparedTransaction.transactions
          ),
          rewards: [{ amount: '0.01', tokenId: mockArbArbTokenId }],
        },
      },
    ])

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_collect_earnings_press, {
      depositTokenId: mockArbUsdcTokenId,
      tokenAmount: '10.75',
      networkId: NetworkId['arbitrum-sepolia'],
      providerId: 'aave-v3',
      rewards: [{ amount: '0.01', tokenId: mockArbArbTokenId }],
    })
  })

  it('disables cta and shows loading spinner when withdraw is submitted', async () => {
    const store = createMockStore({ tokens: mockStoreTokens, earn: { withdrawStatus: 'loading' } })
    const { getByTestId, queryByTestId } = render(
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

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/RewardsLoading')).toBeFalsy()
    })
    await waitFor(() => {
      expect(queryByTestId('EarnCollect/ApyLoading')).toBeFalsy()
    })
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
            depositTokenId: mockArbUsdcTokenId,
            poolTokenId: networkConfig.aaveArbUsdcTokenId,
          }}
        />
      </Provider>
    )

    await waitFor(() => {
      expect(queryByTestId('EarnCollect/RewardsLoading')).toBeFalsy()
    })
    await waitFor(() => {
      expect(queryByTestId('EarnCollect/ApyLoading')).toBeFalsy()
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
    expect(ValoraAnalytics.track).toBeCalledWith(EarnEvents.earn_withdraw_add_gas_press, {
      gasTokenId: mockArbEthTokenId,
    })
  })

  it('shows gas subsidized copy when feature gate is true', async () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (featureGateName) =>
          featureGateName === StatsigFeatureGates.SUBSIDIZE_STABLECOIN_EARN_GAS_FEES
      )
    const { getByTestId } = render(
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
    expect(getByTestId('EarnCollect/GasSubsidized')).toBeTruthy()
  })
})

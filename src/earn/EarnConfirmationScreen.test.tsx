import { fireEvent, render, waitFor } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnConfirmationScreen from 'src/earn/EarnConfirmationScreen'
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
import { createMockStore } from 'test/utils'
import {
  mockAaveArbUsdcAddress,
  mockAaveArbUsdcTokenId,
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
    [mockAaveArbUsdcTokenId]: {
      networkId: NetworkId['arbitrum-sepolia'],
      address: mockAaveArbUsdcAddress,
      tokenId: mockAaveArbUsdcTokenId,
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

describe('EarnConfirmationScreen', () => {
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
          component={EarnConfirmationScreen}
          params={{
            pool: mockEarnPositions[0],
            mode: 'collect',
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.collect.titleClaim')).toBeTruthy()
    expect(getByText('earnFlow.collect.total')).toBeTruthy()
    expect(getByTestId(`EarnConfirmation/${mockArbUsdcTokenId}/CryptoAmount`)).toHaveTextContent(
      '11.83 USDC'
    )
    expect(getByTestId(`EarnConfirmation/${mockArbUsdcTokenId}/FiatAmount`)).toHaveTextContent(
      '₱15.73'
    )
    expect(getByTestId('EarnConfirmationScreen/CTA')).toBeDisabled()

    expect(queryByText('earnFlow.collect.plus')).toBeFalsy()
    expect(queryByTestId(`EarnConfirmation/${mockArbArbTokenId}/CryptoAmount`)).toBeFalsy()
    expect(queryByTestId(`EarnConfirmation/${mockArbArbTokenId}/FiatAmount`)).toBeFalsy()
    await waitFor(() => {
      expect(queryByTestId('EarnConfirmationScreen/CTA')).toBeEnabled()
    })
    await waitFor(() => {
      expect(queryByTestId('EarnConfirmation/GasLoading')).toBeFalsy()
    })
  })

  it('shows error and keeps cta disabled if prepare tx fails', async () => {
    jest
      .mocked(prepareWithdrawAndClaimTransactions)
      .mockRejectedValue(new Error('Failed to prepare'))
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnConfirmationScreen}
          params={{
            pool: mockEarnPositions[0],
            mode: 'collect',
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.collect.titleClaim')).toBeTruthy()
    expect(getByText('earnFlow.collect.total')).toBeTruthy()
    expect(getByTestId('EarnConfirmation/GasLoading')).toBeTruthy()
    expect(getByTestId('EarnConfirmationScreen/CTA')).toBeDisabled()

    await waitFor(() => {
      expect(queryByTestId('EarnConfirmation/GasLoading')).toBeFalsy()
    })
    expect(getByText('earnFlow.collect.errorTitle')).toBeTruthy()
    expect(getByTestId('EarnConfirmation/GasError')).toBeTruthy()
    expect(getByTestId('EarnConfirmationScreen/CTA')).toBeDisabled()
  })

  it('disables cta if not enough balance for gas', async () => {
    jest.mocked(prepareWithdrawAndClaimTransactions).mockResolvedValue({
      type: 'not-enough-balance-for-gas',
      feeCurrencies: [mockPreparedTransaction.feeCurrency],
    })
    const { getByText, getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnConfirmationScreen}
          params={{
            pool: mockEarnPositions[0],
            mode: 'collect',
          }}
        />
      </Provider>
    )

    expect(getByText('earnFlow.collect.titleClaim')).toBeTruthy()
    expect(getByText('earnFlow.collect.total')).toBeTruthy()
    expect(getByTestId('EarnConfirmation/GasLoading')).toBeTruthy()
    expect(getByTestId('EarnConfirmationScreen/CTA')).toBeDisabled()

    await waitFor(() => {
      expect(queryByTestId('EarnConfirmation/GasLoading')).toBeFalsy()
    })
    expect(getByTestId('EarnConfirmationScreen/CTA')).toBeDisabled()
    expect(getByTestId('EarnConfirmation/GasError')).toBeTruthy()
  })

  it('pressing cta dispatches withdraw action and fires analytics event', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnConfirmationScreen}
          params={{
            pool: mockEarnPositions[0],
            mode: 'collect',
          }}
        />
      </Provider>
    )

    await waitFor(() => {
      expect(getByTestId('EarnConfirmationScreen/CTA')).toBeEnabled()
    })

    fireEvent.press(getByTestId('EarnConfirmationScreen/CTA'))

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
          component={EarnConfirmationScreen}
          params={{
            pool: mockEarnPositions[0],
            mode: 'collect',
          }}
        />
      </Provider>
    )

    await waitFor(() => {
      expect(queryByTestId('EarnConfirmation/GasLoading')).toBeFalsy()
    })

    expect(getByTestId('EarnConfirmationScreen/CTA')).toBeDisabled()
    expect(getByTestId('EarnConfirmationScreen/CTA')).toContainElement(
      getByTestId('Button/Loading')
    )
  })

  it('navigate and fire analytics on no gas CTA press', async () => {
    jest.mocked(prepareWithdrawAndClaimTransactions).mockResolvedValue({
      type: 'not-enough-balance-for-gas',
      feeCurrencies: [mockPreparedTransaction.feeCurrency],
    })

    const { getByText, queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={EarnConfirmationScreen}
          params={{
            pool: mockEarnPositions[0],
            mode: 'collect',
          }}
        />
      </Provider>
    )

    await waitFor(() => {
      expect(queryByTestId('EarnConfirmation/RewardsLoading')).toBeFalsy()
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
          component={EarnConfirmationScreen}
          params={{
            pool: mockEarnPositions[0],
            mode: 'collect',
          }}
        />
      </Provider>
    )
    expect(getByTestId('EarnConfirmation/GasSubsidized')).toBeTruthy()
  })
})
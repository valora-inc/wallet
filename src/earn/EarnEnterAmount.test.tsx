import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { DeviceEventEmitter } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnEnterAmount from 'src/earn/EarnEnterAmount'
import { usePrepareEnterAmountTransactionsCallback } from 'src/earn/hooks'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { SwapTransaction } from 'src/swap/types'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import {
  PreparedTransactionsNotEnoughBalanceForGas,
  PreparedTransactionsPossible,
} from 'src/viem/prepareTransactions'
import networkConfig from 'src/web3/networkConfig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import {
  mockAaveArbUsdcTokenId,
  mockAccount,
  mockArbArbTokenId,
  mockArbEthTokenId,
  mockArbUsdcTokenId,
  mockEarnPositions,
  mockPositions,
  mockRewardsPositions,
  mockTokenBalances,
  mockUSDCAddress,
} from 'test/values'

jest.mock('src/earn/hooks')
jest.mock('react-native-localize')
jest.mock('src/statsig') // statsig isn't used directly but the hooksApiSelector uses it
jest
  .mocked(getFeatureGate)
  .mockImplementation((featureGateName) => featureGateName === StatsigFeatureGates.SHOW_POSITIONS)

const mockPreparedTransaction: PreparedTransactionsPossible = {
  type: 'possible' as const,
  transactions: [
    {
      from: '0xfrom',
      to: '0xto',
      data: '0xdata',
      gas: BigInt(5e12),
      _baseFeePerGas: BigInt(1),
      maxFeePerGas: BigInt(1),
      maxPriorityFeePerGas: undefined,
    },
    {
      from: '0xfrom',
      to: '0xto',
      data: '0xdata',
      gas: BigInt(1e12),
      _baseFeePerGas: BigInt(1),
      maxFeePerGas: BigInt(1),
      maxPriorityFeePerGas: undefined,
    },
  ],
  feeCurrency: {
    ...mockTokenBalances[mockArbEthTokenId],
    isNative: true,
    balance: new BigNumber(10),
    priceUsd: new BigNumber(1),
    lastKnownPriceUsd: new BigNumber(1),
  },
}

const mockPreparedTransactionNotEnough: PreparedTransactionsNotEnoughBalanceForGas = {
  type: 'not-enough-balance-for-gas' as const,
  feeCurrencies: [
    {
      ...mockTokenBalances[mockArbEthTokenId],
      isNative: true,
      balance: new BigNumber(0),
      priceUsd: new BigNumber(1500),
      lastKnownPriceUsd: new BigNumber(1500),
    },
  ],
}

const mockFeeCurrencies: TokenBalance[] = [
  {
    ...mockTokenBalances[mockArbEthTokenId],
    isNative: true,
    balance: new BigNumber(1),
    priceUsd: new BigNumber(1500),
    lastKnownPriceUsd: new BigNumber(1500),
  },
]

const mockSwapTransaction: SwapTransaction = {
  swapType: 'same-chain',
  chainId: 42161,
  price: '2439',
  guaranteedPrice: '2377',
  appFeePercentageIncludedInPrice: '0.6',
  sellTokenAddress: '0xEeeeeeE',
  buyTokenAddress: mockUSDCAddress,
  sellAmount: '410000000000000',
  buyAmount: '1000000',
  allowanceTarget: '0x0000000000000000000000000000000000000123',
  from: mockAccount,
  to: '0x0000000000000000000000000000000000000123',
  value: '0',
  data: '0x0',
  gas: '1800000',
  estimatedGasUse: undefined,
  estimatedPriceImpact: '0.1',
}

const store = createMockStore({
  tokens: {
    tokenBalances: {
      ...mockTokenBalances,
      mockArbUsdcTokenId: {
        ...mockTokenBalances[mockArbUsdcTokenId],
        balance: '10',
      },
      mockArbEthTokenId: {
        ...mockTokenBalances[mockArbEthTokenId],
        balance: '1',
      },
      mockArbArbTokenId: {
        ...mockTokenBalances[mockArbArbTokenId],
        minimumAppVersionToSwap: '1.0.0',
        balance: '1',
      },
      mockAaveArbUsdcTokenId: {
        ...mockTokenBalances[mockAaveArbUsdcTokenId],
        balance: '10',
      },
    },
  },
  positions: {
    positions: [...mockPositions, ...mockRewardsPositions],
  },
})

const params = {
  pool: mockEarnPositions[0],
}

const mockPoolWithHighPricePerShare = {
  ...mockEarnPositions[0],
  pricePerShare: ['2'],
  balance: '10',
}

describe('EarnEnterAmount', () => {
  const refreshPreparedTransactionsSpy = jest.fn()
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getNumberFormatSettings)
      .mockReturnValue({ decimalSeparator: '.', groupingSeparator: ',' })
    store.clearActions()
    jest.mocked(usePrepareEnterAmountTransactionsCallback).mockReturnValue({
      prepareTransactionsResult: undefined,
      refreshPreparedTransactions: refreshPreparedTransactionsSpy,
      clearPreparedTransactions: jest.fn(),
      prepareTransactionError: undefined,
      isPreparingTransactions: false,
    })
  })

  describe('deposit', () => {
    const depositParams = { ...params, mode: 'deposit' }
    it('should show only the deposit token and not include the token dropdown', async () => {
      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={EarnEnterAmount} params={depositParams} />
        </Provider>
      )

      expect(getByTestId('EarnEnterAmount/TokenSelect')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/TokenSelect')).toHaveTextContent('USDC')
      expect(getByTestId('EarnEnterAmount/TokenSelect')).toBeDisabled()
      expect(queryByTestId('downArrowIcon')).toBeFalsy()
    })

    it('should apply the maximum amount if the user selects the max option', async () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={EarnEnterAmount} params={depositParams} />
        </Provider>
      )
      await act(() => {
        DeviceEventEmitter.emit('keyboardDidShow', { endCoordinates: { height: 100 } })
      })

      fireEvent.press(within(getByTestId('EarnEnterAmount/AmountOptions')).getByText('maxSymbol'))
      expect(getByTestId('EarnEnterAmount/TokenAmountInput').props.value).toBe('10') // balance
    })

    it('should prepare transactions with the expected inputs', async () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={EarnEnterAmount} params={depositParams} />
        </Provider>
      )

      fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '.25')

      await waitFor(() => expect(refreshPreparedTransactionsSpy).toHaveBeenCalledTimes(1))
      expect(refreshPreparedTransactionsSpy).toHaveBeenCalledWith({
        amount: '0.25',
        token: {
          ...mockTokenBalances[mockArbUsdcTokenId],
          priceUsd: new BigNumber(1),
          lastKnownPriceUsd: new BigNumber(1),
          balance: new BigNumber(10),
        },
        walletAddress: mockAccount.toLowerCase(),
        pool: mockEarnPositions[0],
        hooksApiUrl: networkConfig.hooksApiUrl,
        feeCurrencies: mockFeeCurrencies,
        shortcutId: 'deposit',
        useMax: false,
      })
    })

    it('should show tx details and handle navigating to the deposit bottom sheet', async () => {
      jest.mocked(usePrepareEnterAmountTransactionsCallback).mockReturnValue({
        prepareTransactionsResult: {
          prepareTransactionsResult: mockPreparedTransaction,
          swapTransaction: undefined,
        },
        refreshPreparedTransactions: jest.fn(),
        clearPreparedTransactions: jest.fn(),
        prepareTransactionError: undefined,
        isPreparingTransactions: false,
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <MockedNavigator component={EarnEnterAmount} params={depositParams} />
        </Provider>
      )

      fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '8')

      await waitFor(() => expect(getByText('earnFlow.enterAmount.continue')).not.toBeDisabled())

      expect(getByTestId('EarnEnterAmount/Deposit/Crypto')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/Deposit/Crypto')).toHaveTextContent('8.00 USDC')

      expect(getByTestId('EarnEnterAmount/Deposit/Fiat')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/Deposit/Fiat')).toHaveTextContent('₱10.64')

      expect(getByTestId('EarnEnterAmount/Fees')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/Fees')).toHaveTextContent('₱0.012')

      fireEvent.press(getByText('earnFlow.enterAmount.continue'))

      await waitFor(() => expect(AppAnalytics.track).toHaveBeenCalledTimes(1))
      expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_enter_amount_continue_press, {
        amountEnteredIn: 'token',
        amountInUsd: '8.00',
        networkId: NetworkId['arbitrum-sepolia'],
        depositTokenId: mockArbUsdcTokenId,
        providerId: mockEarnPositions[0].appId,
        poolId: mockEarnPositions[0].positionId,
        fromTokenId: mockArbUsdcTokenId,
        fromTokenAmount: '8',
        depositTokenAmount: '8',
        mode: 'deposit',
      })
      await waitFor(() => expect(getByText('earnFlow.depositBottomSheet.title')).toBeVisible())
    })
  })

  describe('swap-deposit', () => {
    const swapDepositParams = { ...params, mode: 'swap-deposit' }
    it('should show the token dropdown and allow the user to select a token', async () => {
      const { getByTestId, getAllByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={EarnEnterAmount} params={swapDepositParams} />
        </Provider>
      )

      expect(getByTestId('EarnEnterAmount/TokenSelect')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/TokenSelect')).toHaveTextContent('ETH')
      expect(getByTestId('EarnEnterAmount/TokenSelect')).toBeEnabled()
      expect(getByTestId('downArrowIcon')).toBeTruthy()
      expect(getAllByTestId('TokenBalanceItem')).toHaveLength(2)
      expect(getAllByTestId('TokenBalanceItem')[0]).toHaveTextContent('ETH')
      expect(getAllByTestId('TokenBalanceItem')[1]).toHaveTextContent('ARB')
      expect(getByTestId('TokenBottomSheet')).not.toHaveTextContent('USDC')
    })

    it('should default to the swappable token if only one is eligible and not show dropdown', async () => {
      const store = createMockStore({
        tokens: {
          tokenBalances: {
            ...mockTokenBalances,
            [mockArbUsdcTokenId]: {
              ...mockTokenBalances[mockArbUsdcTokenId],
              balance: '10',
            },
            mockArbEthTokenId: {
              ...mockTokenBalances[mockArbEthTokenId],
              minimumAppVersionToSwap: '1.0.0',
              balance: '0', // not eligible for swap
            },
            mockArbArbTokenId: {
              ...mockTokenBalances[mockArbArbTokenId],
              balance: '1', // eligible for swap
            },
          },
        },
      })

      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={EarnEnterAmount} params={swapDepositParams} />
        </Provider>
      )

      expect(getByTestId('EarnEnterAmount/TokenSelect')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/TokenSelect')).toHaveTextContent('ARB')
      expect(getByTestId('EarnEnterAmount/TokenSelect')).toBeDisabled()
      expect(queryByTestId('downArrowIcon')).toBeFalsy()
    })

    it('should prepare transactions with the expected inputs', async () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={EarnEnterAmount} params={swapDepositParams} />
        </Provider>
      )

      fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '.25')

      await waitFor(() => expect(refreshPreparedTransactionsSpy).toHaveBeenCalledTimes(1))
      expect(refreshPreparedTransactionsSpy).toHaveBeenCalledWith({
        amount: '0.25',
        token: {
          ...mockTokenBalances[mockArbEthTokenId],
          priceUsd: new BigNumber(1500),
          lastKnownPriceUsd: new BigNumber(1500),
          balance: new BigNumber(1),
        },
        walletAddress: mockAccount.toLowerCase(),
        pool: mockEarnPositions[0],
        hooksApiUrl: networkConfig.hooksApiUrl,
        feeCurrencies: mockFeeCurrencies,
        shortcutId: 'swap-deposit',
        useMax: false,
      })
    })

    it('should show tx details and handle navigating to the deposit bottom sheet', async () => {
      jest.mocked(usePrepareEnterAmountTransactionsCallback).mockReturnValue({
        prepareTransactionsResult: {
          prepareTransactionsResult: mockPreparedTransaction,
          swapTransaction: mockSwapTransaction,
        },
        refreshPreparedTransactions: jest.fn(),
        clearPreparedTransactions: jest.fn(),
        prepareTransactionError: undefined,
        isPreparingTransactions: false,
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <MockedNavigator component={EarnEnterAmount} params={swapDepositParams} />
        </Provider>
      )

      fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '0.00041')

      await waitFor(() => expect(getByText('earnFlow.enterAmount.continue')).not.toBeDisabled())

      expect(getByTestId('EarnEnterAmount/Swap/From')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/Swap/From')).toHaveTextContent('0.00041 ETH')

      expect(getByTestId('EarnEnterAmount/Swap/To')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/Swap/To')).toHaveTextContent('1.00 USDC')

      expect(getByTestId('EarnEnterAmount/Deposit/Crypto')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/Deposit/Crypto')).toHaveTextContent('1.00 USDC')

      expect(getByTestId('EarnEnterAmount/Deposit/Fiat')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/Deposit/Fiat')).toHaveTextContent('₱1.33')

      expect(getByTestId('EarnEnterAmount/Fees')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/Fees')).toHaveTextContent('₱0.012')

      fireEvent.press(getByText('earnFlow.enterAmount.continue'))

      await waitFor(() => expect(AppAnalytics.track).toHaveBeenCalledTimes(1))
      expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_enter_amount_continue_press, {
        amountEnteredIn: 'token',
        amountInUsd: '0.62',
        networkId: NetworkId['arbitrum-sepolia'],
        fromTokenAmount: '0.00041',
        depositTokenId: mockArbUsdcTokenId,
        providerId: mockEarnPositions[0].appId,
        poolId: mockEarnPositions[0].positionId,
        fromTokenId: mockArbEthTokenId,
        depositTokenAmount: '0.99999',
        mode: 'swap-deposit',
      })
      await waitFor(() => expect(getByText('earnFlow.depositBottomSheet.title')).toBeVisible())
    })
  })

  describe('withdraw', () => {
    const withdrawParams = { ...params, mode: 'withdraw' }
    it('should show the deposit token and a disabled token dropdown', async () => {
      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={EarnEnterAmount} params={withdrawParams} />
        </Provider>
      )

      expect(getByTestId('EarnEnterAmount/TokenSelect')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/TokenSelect')).toHaveTextContent('USDC')
      expect(getByTestId('EarnEnterAmount/TokenSelect')).toBeDisabled()
      expect(queryByTestId('downArrowIcon')).toBeFalsy()
    })

    it('should apply the maximum amount if the user selects the max option', async () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={EarnEnterAmount} params={withdrawParams} />
        </Provider>
      )
      await act(() => {
        DeviceEventEmitter.emit('keyboardDidShow', { endCoordinates: { height: 100 } })
      })

      fireEvent.press(within(getByTestId('EarnEnterAmount/AmountOptions')).getByText('maxSymbol'))
      expect(getByTestId('EarnEnterAmount/TokenAmountInput').props.value).toBe('11') // balance * pool price per share
    })

    it('should prepare transactions with the expected inputs', async () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <MockedNavigator
            component={EarnEnterAmount}
            params={{ pool: mockPoolWithHighPricePerShare, mode: 'withdraw' }}
          />
        </Provider>
      )

      fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '.25')

      await waitFor(() => expect(refreshPreparedTransactionsSpy).toHaveBeenCalledTimes(1))
      expect(refreshPreparedTransactionsSpy).toHaveBeenCalledWith({
        amount: '0.125',
        token: {
          ...mockTokenBalances[mockAaveArbUsdcTokenId],
          priceUsd: new BigNumber(1),
          lastKnownPriceUsd: new BigNumber(1),
          balance: new BigNumber(10),
        },
        walletAddress: mockAccount.toLowerCase(),
        pool: mockPoolWithHighPricePerShare,
        hooksApiUrl: networkConfig.hooksApiUrl,
        feeCurrencies: mockFeeCurrencies,
        shortcutId: 'withdraw',
        useMax: false,
      })
    })

    it('should show tx details for withdrawal', async () => {
      jest.mocked(usePrepareEnterAmountTransactionsCallback).mockReturnValue({
        prepareTransactionsResult: {
          prepareTransactionsResult: mockPreparedTransaction,
          swapTransaction: undefined,
        },
        refreshPreparedTransactions: jest.fn(),
        clearPreparedTransactions: jest.fn(),
        prepareTransactionError: undefined,
        isPreparingTransactions: false,
      })

      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <MockedNavigator component={EarnEnterAmount} params={withdrawParams} />
        </Provider>
      )

      fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '8')

      await waitFor(() => expect(getByText('earnFlow.enterAmount.continue')).not.toBeDisabled())

      expect(getByTestId('EarnEnterAmount/Withdraw/Crypto')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/Withdraw/Crypto')).toHaveTextContent('11.00 USDC')

      expect(getByTestId('EarnEnterAmount/Withdraw/Fiat')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/Withdraw/Fiat')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/Withdraw/Fiat')).toHaveTextContent('₱14.63')

      expect(getByTestId('EarnEnterAmount/Fees')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/Fees')).toHaveTextContent('₱0.012')

      fireEvent.press(getByText('earnFlow.enterAmount.continue'))

      await waitFor(() => expect(AppAnalytics.track).toHaveBeenCalledTimes(1))
      expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_enter_amount_continue_press, {
        amountEnteredIn: 'token',
        amountInUsd: '8.00',
        networkId: NetworkId['arbitrum-sepolia'],
        depositTokenId: mockArbUsdcTokenId,
        providerId: mockEarnPositions[0].appId,
        poolId: mockEarnPositions[0].positionId,
        fromTokenId: 'arbitrum-sepolia:0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8',
        fromTokenAmount: '8',
        mode: 'withdraw',
      })

      expect(navigate).toHaveBeenCalledWith(Screens.EarnConfirmationScreen, {
        pool: mockEarnPositions[0],
        mode: 'withdraw',
        inputAmount: '8',
        useMax: false,
      })
    })

    it('should allow the user to set an input value over the pool balance if pricePerShare is greater than 1', async () => {
      jest.mocked(usePrepareEnterAmountTransactionsCallback).mockReturnValue({
        prepareTransactionsResult: {
          prepareTransactionsResult: mockPreparedTransaction,
          swapTransaction: undefined,
        },
        refreshPreparedTransactions: jest.fn(),
        clearPreparedTransactions: jest.fn(),
        prepareTransactionError: undefined,
        isPreparingTransactions: false,
      })

      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <MockedNavigator
            component={EarnEnterAmount}
            params={{ pool: mockPoolWithHighPricePerShare, mode: 'withdraw' }}
          />
        </Provider>
      )

      fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '15')
      expect(queryByTestId('EarnEnterAmount/NotEnoughBalanceWarning')).toBeFalsy()
      expect(getByTestId('EarnEnterAmount/Continue')).toBeEnabled()
    })

    it('should not allow the user to set an input amount higher than pool balance * pricePerShare', async () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <MockedNavigator
            component={EarnEnterAmount}
            params={{ pool: mockPoolWithHighPricePerShare, mode: 'withdraw' }}
          />
        </Provider>
      )

      fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '20.001')
      expect(getByTestId('EarnEnterAmount/NotEnoughBalanceWarning')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/Continue')).toBeDisabled()
    })

    it('should show the Claiming Reward line item if withdrawalIncludesClaim is true and user has rewards', async () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <MockedNavigator
            component={EarnEnterAmount}
            params={{
              pool: {
                ...mockEarnPositions[0],
                dataProps: { ...mockEarnPositions[0].dataProps, withdrawalIncludesClaim: true },
              },
              mode: 'withdraw',
            }}
          />
        </Provider>
      )

      expect(getByTestId('LabelWithInfo/ClaimingReward-0')).toBeTruthy()
      expect(getByTestId('EarnEnterAmount/Reward-0')).toHaveTextContent('₱0.016')
      expect(getByTestId('EarnEnterAmount/Reward-0-crypto')).toHaveTextContent('0.01 ARB')
    })

    it('should show the Withdrawing and Claiming card if withdrawalIncludesClaim is true', async () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <MockedNavigator
            component={EarnEnterAmount}
            params={{
              pool: {
                ...mockEarnPositions[0],
                dataProps: { ...mockEarnPositions[0].dataProps, withdrawalIncludesClaim: true },
              },
              mode: 'withdraw',
            }}
          />
        </Provider>
      )

      expect(getByTestId('EarnEnterAmount/WithdrawingAndClaimingCard')).toBeTruthy()
    })
  })

  // tests independent of deposit / swap-deposit
  it('should show a warning and not allow the user to continue if they input an amount greater than balance', async () => {
    jest.mocked(usePrepareEnterAmountTransactionsCallback).mockReturnValue({
      prepareTransactionsResult: {
        prepareTransactionsResult: mockPreparedTransaction,
        swapTransaction: undefined,
      },
      refreshPreparedTransactions: jest.fn(),
      clearPreparedTransactions: jest.fn(),
      prepareTransactionError: undefined,
      isPreparingTransactions: false,
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '12')

    expect(getByTestId('EarnEnterAmount/NotEnoughBalanceWarning')).toBeTruthy()
    expect(getByTestId('EarnEnterAmount/Continue')).toBeDisabled()
  })

  it('should show loading spinner when preparing transaction', async () => {
    jest.mocked(usePrepareEnterAmountTransactionsCallback).mockReturnValue({
      prepareTransactionsResult: undefined,
      refreshPreparedTransactions: jest.fn(),
      clearPreparedTransactions: jest.fn(),
      prepareTransactionError: undefined,
      isPreparingTransactions: true,
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '8')

    await waitFor(() =>
      expect(getByTestId('EarnEnterAmount/Continue')).toContainElement(
        getByTestId('Button/Loading')
      )
    )
    expect(getByTestId('EarnEnterAmount/Continue')).toBeDisabled()
  })

  describe.each([
    { decimal: '.', group: ',' },
    { decimal: ',', group: '.' },
  ])('with decimal separator "$decimal" and group separator "$group"', ({ decimal, group }) => {
    const replaceSeparators = (value: string) =>
      value.replace(/\./g, '|').replace(/,/g, group).replace(/\|/g, decimal)

    beforeEach(() => {
      jest
        .mocked(getNumberFormatSettings)
        .mockReturnValue({ decimalSeparator: decimal, groupingSeparator: group })
      BigNumber.config({
        FORMAT: {
          decimalSeparator: decimal,
          groupSeparator: group,
          groupSize: 3,
        },
      })
    })

    const mockStore = createMockStore({
      tokens: {
        tokenBalances: {
          ...mockTokenBalances,
          [mockArbUsdcTokenId]: {
            ...mockTokenBalances[mockArbUsdcTokenId],
            balance: '100000.42',
          },
        },
      },
    })

    it('selecting max token amount applies correct decimal separator', async () => {
      const { getByTestId } = render(
        <Provider store={mockStore}>
          <MockedNavigator component={EarnEnterAmount} params={params} />
        </Provider>
      )

      await act(() => {
        DeviceEventEmitter.emit('keyboardDidShow', { endCoordinates: { height: 100 } })
      })

      fireEvent.press(within(getByTestId('EarnEnterAmount/AmountOptions')).getByText('maxSymbol'))
      expect(getByTestId('EarnEnterAmount/TokenAmountInput').props.value).toBe(
        replaceSeparators('100000.42')
      )
      expect(getByTestId('EarnEnterAmount/LocalAmountInput').props.value).toBe(
        replaceSeparators('₱133,000.56')
      )
    })
  })

  it('should track analytics and navigate correctly when tapping cta to add gas', async () => {
    jest.mocked(usePrepareEnterAmountTransactionsCallback).mockReturnValue({
      prepareTransactionsResult: {
        prepareTransactionsResult: mockPreparedTransactionNotEnough,
        swapTransaction: undefined,
      },
      refreshPreparedTransactions: jest.fn(),
      clearPreparedTransactions: jest.fn(),
      prepareTransactionError: undefined,
      isPreparingTransactions: false,
    })
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )

    await waitFor(() => expect(getByTestId('EarnEnterAmount/NotEnoughForGasWarning')).toBeTruthy())
    fireEvent.press(
      getByText(
        'earnFlow.enterAmount.notEnoughBalanceForGasWarning.noGasCta, {"feeTokenSymbol":"ETH","network":"Arbitrum Sepolia"}'
      )
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_deposit_add_gas_press, {
      gasTokenId: mockArbEthTokenId,
      networkId: NetworkId['arbitrum-sepolia'],
      poolId: mockEarnPositions[0].positionId,
      providerId: mockEarnPositions[0].appId,
      depositTokenId: mockArbUsdcTokenId,
    })
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeAmount, {
      tokenId: mockArbEthTokenId,
      flow: CICOFlow.CashIn,
      tokenSymbol: 'ETH',
    })
  })

  it('should show the FeeDetailsBottomSheet when the user taps the fee details icon', async () => {
    jest.mocked(usePrepareEnterAmountTransactionsCallback).mockReturnValue({
      prepareTransactionsResult: {
        prepareTransactionsResult: mockPreparedTransaction,
        swapTransaction: undefined,
      },
      refreshPreparedTransactions: jest.fn(),
      clearPreparedTransactions: jest.fn(),
      prepareTransactionError: undefined,
      isPreparingTransactions: false,
    })

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )

    fireEvent.press(getByTestId('LabelWithInfo/FeeLabel'))
    expect(getByText('earnFlow.enterAmount.feeBottomSheet.feeDetails')).toBeVisible()
    expect(getByTestId('EstNetworkFee/Value')).toBeTruthy()
    expect(getByTestId('MaxNetworkFee/Value')).toBeTruthy()
    expect(getByText('earnFlow.enterAmount.feeBottomSheet.networkFeeDescription')).toBeVisible()
  })

  it('should show swap fees on the FeeDetailsBottomSheet when swap transaction is present', async () => {
    jest.mocked(usePrepareEnterAmountTransactionsCallback).mockReturnValue({
      prepareTransactionsResult: {
        prepareTransactionsResult: mockPreparedTransaction,
        swapTransaction: mockSwapTransaction,
      },
      refreshPreparedTransactions: jest.fn(),
      clearPreparedTransactions: jest.fn(),
      prepareTransactionError: undefined,
      isPreparingTransactions: false,
    })

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )

    fireEvent.press(getByTestId('LabelWithInfo/FeeLabel'))
    expect(getByText('earnFlow.enterAmount.feeBottomSheet.feeDetails')).toBeVisible()
    expect(getByTestId('EstNetworkFee/Value')).toBeTruthy()
    expect(getByTestId('MaxNetworkFee/Value')).toBeTruthy()
    expect(getByTestId('SwapFee/Value')).toBeTruthy()
    expect(
      getByText(
        'earnFlow.enterAmount.feeBottomSheet.networkSwapFeeDescription, {"appFeePercentage":"0.6"}'
      )
    ).toBeVisible()
    expect(getByTestId('FeeDetailsBottomSheet/GotIt')).toBeVisible()
  })

  it('should display swap bottom sheet when the user taps the swap details icon', async () => {
    jest.mocked(usePrepareEnterAmountTransactionsCallback).mockReturnValue({
      prepareTransactionsResult: {
        prepareTransactionsResult: mockPreparedTransaction,
        swapTransaction: mockSwapTransaction,
      },
      refreshPreparedTransactions: jest.fn(),
      clearPreparedTransactions: jest.fn(),
      prepareTransactionError: undefined,
      isPreparingTransactions: false,
    })

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )

    fireEvent.press(getByTestId('LabelWithInfo/SwapLabel'))
    expect(getByText('earnFlow.enterAmount.swapBottomSheet.swapDetails')).toBeVisible()
    expect(getByTestId('SwapTo')).toBeTruthy()
    expect(getByTestId('SwapFrom')).toBeTruthy()
    expect(getByTestId('SwapTo/Value')).toBeTruthy()
    expect(getByTestId('SwapFrom/Value')).toBeTruthy()
    expect(getByText('earnFlow.enterAmount.swapBottomSheet.whySwap')).toBeVisible()
    expect(getByText('earnFlow.enterAmount.swapBottomSheet.swapDescription')).toBeVisible()
    expect(getByTestId('SwapDetailsBottomSheet/GotIt')).toBeVisible()
  })
})

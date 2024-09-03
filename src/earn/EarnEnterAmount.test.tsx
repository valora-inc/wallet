import { fireEvent, render, waitFor } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { getNumberFormatSettings } from 'react-native-localize'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnEnterAmount from 'src/earn/EarnEnterAmount'
import { usePrepareSupplyTransactions } from 'src/earn/prepareTransactions'
import { getDynamicConfigParams, getFeatureGate, getMultichainFeatures } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigFeatureGates, StatsigMultiNetworkDynamicConfig } from 'src/statsig/types'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { PreparedTransactionsPossible } from 'src/viem/prepareTransactions'
import networkConfig from 'src/web3/networkConfig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockArbEthTokenId,
  mockArbUsdcTokenId,
  mockEarnPositions,
  mockTokenBalances,
} from 'test/values'

jest.mock('src/earn/prepareTransactions')
jest.mock('react-native-localize')
jest.mock('src/statsig')

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
    isNative: true,
    balance: new BigNumber(10),
    priceUsd: new BigNumber(1),
    lastKnownPriceUsd: new BigNumber(1),
  },
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

const priceFetchedAt = Date.now()

const store = createMockStore({
  tokens: {
    tokenBalances: {
      [mockArbUsdcTokenId]: {
        tokenId: mockArbUsdcTokenId,
        symbol: 'USDC',
        priceUsd: '1',
        priceFetchedAt: priceFetchedAt,
        networkId: NetworkId['arbitrum-sepolia'],
        balance: '10',
      },
      mockArbEthTokenId: {
        ...mockTokenBalances[mockArbEthTokenId],
        balance: '1',
      },
    },
  },
  earn: { poolInfoFetchStatus: 'loading' },
})

const refreshPreparedTransactionsSpy = jest.fn()
jest.mocked(usePrepareSupplyTransactions).mockReturnValue({
  prepareTransactionsResult: undefined,
  refreshPreparedTransactions: refreshPreparedTransactionsSpy,
  clearPreparedTransactions: jest.fn(),
  prepareTransactionError: undefined,
  isPreparingTransactions: false,
})

const params = {
  pool: mockEarnPositions[0],
}

describe('EarnEnterAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getNumberFormatSettings)
      .mockReturnValue({ decimalSeparator: '.', groupingSeparator: ',' })
    store.clearActions()
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.SHOW_MULTIPLE_EARN_POOLS)
    jest.mocked(getDynamicConfigParams).mockImplementation(({ defaultValues }) => defaultValues)
    jest
      .mocked(getMultichainFeatures)
      .mockReturnValue(
        DynamicConfigs[StatsigMultiNetworkDynamicConfig.MULTI_CHAIN_FEATURES].defaultValues
      )
  })

  it('should render APY and EarnUpTo', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )
    expect(getByTestId('EarnEnterAmount/EarnApyAndAmount/Apy')).toBeTruthy()
    expect(getByTestId('EarnEnterAmount/EarnApyAndAmount/Apy')).toHaveTextContent(
      'earnFlow.enterAmount.rate, {"rate":"1.92"}'
    )
  })

  it('should be able to tap info icon (for single pool)', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )
    fireEvent.press(getByTestId('EarnEnterAmount/InfoIcon'))
    await waitFor(() => expect(AppAnalytics.track).toHaveBeenCalledTimes(1))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_enter_amount_info_press)
  })

  it('hides info icon for multiple pools', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )
    expect(queryByTestId('EarnEnterAmount/InfoIcon')).toBeNull()
  })

  it('should prepare transactions with the expected inputs', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '.25')

    await waitFor(() => expect(refreshPreparedTransactionsSpy).toHaveBeenCalledTimes(1))
    expect(refreshPreparedTransactionsSpy).toHaveBeenCalledWith({
      amount: '0.25',
      token: {
        tokenId: mockArbUsdcTokenId,
        symbol: 'USDC',
        priceUsd: new BigNumber(1),
        lastKnownPriceUsd: new BigNumber(1),
        priceFetchedAt: priceFetchedAt,
        networkId: NetworkId['arbitrum-sepolia'],
        balance: new BigNumber(10),
      },
      walletAddress: mockAccount.toLowerCase(),
      pool: mockEarnPositions[0],
      hooksApiUrl: networkConfig.hooksApiUrl,
      feeCurrencies: mockFeeCurrencies,
    })
  })

  it('should handle navigating to the deposit bottom sheet', async () => {
    jest.mocked(usePrepareSupplyTransactions).mockReturnValue({
      prepareTransactionsResult: mockPreparedTransaction,
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

    fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '8')

    await waitFor(() => expect(getByText('earnFlow.enterAmount.continue')).not.toBeDisabled())
    fireEvent.press(getByText('earnFlow.enterAmount.continue'))

    await waitFor(() => expect(AppAnalytics.track).toHaveBeenCalledTimes(1))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_enter_amount_continue_press, {
      amountEnteredIn: 'token',
      amountInUsd: '8.00',
      networkId: NetworkId['arbitrum-sepolia'],
      tokenAmount: '8',
      depositTokenId: mockArbUsdcTokenId,
      userHasFunds: true,
      providerId: 'aave',
    })
    await waitFor(() => expect(getByText('earnFlow.depositBottomSheet.title')).toBeVisible())
  })
  it('should handle navigating to the add crypto bottom sheet', async () => {
    jest.mocked(usePrepareSupplyTransactions).mockReturnValue({
      prepareTransactionsResult: mockPreparedTransaction,
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

    fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '12')

    await waitFor(() => expect(getByText('earnFlow.enterAmount.continue')).not.toBeDisabled())
    fireEvent.press(getByText('earnFlow.enterAmount.continue'))

    await waitFor(() => expect(AppAnalytics.track).toHaveBeenCalledTimes(1))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_enter_amount_continue_press, {
      amountEnteredIn: 'token',
      amountInUsd: '12.00',
      networkId: NetworkId['arbitrum-sepolia'],
      tokenAmount: '12',
      depositTokenId: mockArbUsdcTokenId,
      userHasFunds: false,
      providerId: 'aave',
    })
    await waitFor(() =>
      expect(getByText('earnFlow.addCryptoBottomSheet.description')).toBeVisible()
    )
  })

  it('should show loading spinner when preparing transaction', async () => {
    jest.mocked(usePrepareSupplyTransactions).mockReturnValue({
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
          [mockArbUsdcTokenId]: {
            tokenId: mockArbUsdcTokenId,
            symbol: 'USDC',
            priceUsd: '1',
            priceFetchedAt: priceFetchedAt,
            networkId: NetworkId['arbitrum-sepolia'],
            balance: '100000.42',
          },
        },
      },
    })

    it('entering MAX token applies correct decimal separator', async () => {
      const { getByTestId } = render(
        <Provider store={mockStore}>
          <MockedNavigator component={EarnEnterAmount} params={params} />
        </Provider>
      )

      fireEvent.press(getByTestId('EarnEnterAmount/Max'))
      expect(getByTestId('EarnEnterAmount/TokenAmountInput').props.value).toBe(
        replaceSeparators('100000.42')
      )
      expect(getByTestId('EarnEnterAmount/LocalAmountInput').props.value).toBe(
        replaceSeparators('₱133,000.56')
      )
    })
  })
})

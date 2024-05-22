import { fireEvent, render, waitFor } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import EarnEnterAmount from 'src/earn/EarnEnterAmount'
import { usePrepareSupplyTransactions } from 'src/earn/prepareTransactions'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { PreparedTransactionsPossible } from 'src/viem/prepareTransactions'
import networkConfig from 'src/web3/networkConfig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockAccount, mockArbEthTokenId, mockTokenBalances } from 'test/values'

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
      [networkConfig.arbUsdcTokenId]: {
        tokenId: networkConfig.arbUsdcTokenId,
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
})

const refreshPreparedTransactionsSpy = jest.fn()
jest.mocked(usePrepareSupplyTransactions).mockReturnValue({
  prepareTransactionsResult: undefined,
  refreshPreparedTransactions: refreshPreparedTransactionsSpy,
  clearPreparedTransactions: jest.fn(),
  prepareTransactionError: undefined,
})

const params = {
  tokenId: networkConfig.arbUsdcTokenId,
}

describe('EarnEnterAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render APY and EarnUpTo', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )
    expect(getByTestId('EarnEnterAmount/EarnApyAndAmount/Apy')).toBeTruthy()
    expect(getByTestId('EarnEnterAmount/EarnApyAndAmount/EarnUpTo')).toBeTruthy()
  })

  it('should be able to tap info icon', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )
    fireEvent.press(getByTestId('EarnEnterAmount/InfoIcon'))
    await waitFor(() => expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_enter_amount_info_press)
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
        tokenId: networkConfig.arbUsdcTokenId,
        symbol: 'USDC',
        priceUsd: new BigNumber(1),
        lastKnownPriceUsd: new BigNumber(1),
        priceFetchedAt: priceFetchedAt,
        networkId: NetworkId['arbitrum-sepolia'],
        balance: new BigNumber(10),
      },
      walletAddress: mockAccount.toLowerCase(),
      poolContractAddress: networkConfig.arbAavePoolV3ContractAddress,
      feeCurrencies: mockFeeCurrencies,
    })
  })

  it('should handle navigating to the deposit bottom sheet', async () => {
    jest.mocked(usePrepareSupplyTransactions).mockReturnValue({
      prepareTransactionsResult: mockPreparedTransaction,
      refreshPreparedTransactions: jest.fn(),
      clearPreparedTransactions: jest.fn(),
      prepareTransactionError: undefined,
    })
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '8')

    await waitFor(() => expect(getByText('earnFlow.enterAmount.continue')).not.toBeDisabled())
    fireEvent.press(getByText('earnFlow.enterAmount.continue'))

    await waitFor(() => expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_enter_amount_continue_press,
      {
        amountEnteredIn: 'token',
        amountInUsd: '8.00',
        networkId: NetworkId['arbitrum-sepolia'],
        tokenAmount: '8',
        depositTokenId: networkConfig.arbUsdcTokenId,
        userHasFunds: true,
        providerId: 'aave-v3',
      }
    )
    await waitFor(() => expect(getByText('earnFlow.depositBottomSheet.title')).toBeVisible())
  })
  it('should handle navigating to the add crypto bottom sheet', async () => {
    jest.mocked(usePrepareSupplyTransactions).mockReturnValue({
      prepareTransactionsResult: mockPreparedTransaction,
      refreshPreparedTransactions: jest.fn(),
      clearPreparedTransactions: jest.fn(),
      prepareTransactionError: undefined,
    })
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('EarnEnterAmount/TokenAmountInput'), '12')

    await waitFor(() => expect(getByText('earnFlow.enterAmount.continue')).not.toBeDisabled())
    fireEvent.press(getByText('earnFlow.enterAmount.continue'))

    await waitFor(() => expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_enter_amount_continue_press,
      {
        amountEnteredIn: 'token',
        amountInUsd: '12.00',
        networkId: NetworkId['arbitrum-sepolia'],
        tokenAmount: '12',
        depositTokenId: networkConfig.arbUsdcTokenId,
        userHasFunds: false,
        providerId: 'aave-v3',
      }
    )
    await waitFor(() =>
      expect(getByText('earnFlow.addCryptoBottomSheet.description')).toBeVisible()
    )
  })
})

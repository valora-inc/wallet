import { fireEvent, render, waitFor } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { getNumberFormatSettings } from 'react-native-localize'
import { Provider } from 'react-redux'
import { EarnEvents, TransactionEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import EarnEnterAmount from 'src/earn/EarnEnterAmount'
import { usePrepareSupplyTransactions } from 'src/earn/prepareTransactions'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams } from 'src/statsig'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { PreparedTransactionsPossible } from 'src/viem/prepareTransactions'
import networkConfig from 'src/web3/networkConfig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockAccount, mockArbEthTokenId, mockTokenBalances } from 'test/values'

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
  earn: { poolInfoFetchStatus: 'loading' },
})

jest.mocked(getDynamicConfigParams).mockImplementation(({ defaultValues }) => defaultValues)
const refreshPreparedTransactionsSpy = jest.fn()

const params = {
  tokenId: networkConfig.arbUsdcTokenId,
}

describe('EarnEnterAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getNumberFormatSettings)
      .mockReturnValue({ decimalSeparator: '.', groupingSeparator: ',' })
    jest.mocked(usePrepareSupplyTransactions).mockReturnValue({
      prepareTransactionsResult: undefined,
      refreshPreparedTransactions: refreshPreparedTransactionsSpy,
      clearPreparedTransactions: jest.fn(),
      prepareTransactionError: undefined,
      isPreparingTransactions: false,
    })

    store.clearActions()
  })

  it('should render APY and EarnUpTo', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )
    // Loading states
    expect(getByTestId('EarnEnterAmount/EarnApyAndAmount/Apy/Loading')).toBeTruthy()
    expect(ValoraAnalytics.track).not.toHaveBeenCalled()
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
    expect(ValoraAnalytics.track).not.toHaveBeenCalled()
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
    expect(ValoraAnalytics.track).not.toHaveBeenCalled()
  })

  it('should show warning and fire analytics event if transaction is not possible', async () => {
    jest.mocked(usePrepareSupplyTransactions).mockReturnValue({
      prepareTransactionsResult: {
        type: 'not-enough-balance-for-gas',
        feeCurrencies: mockFeeCurrencies,
      },
      refreshPreparedTransactions: jest.fn(),
      clearPreparedTransactions: jest.fn(),
      prepareTransactionError: undefined,
      isPreparingTransactions: false,
    })
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnEnterAmount} params={params} />
      </Provider>
    )

    expect(
      getByText(
        'earnFlow.enterAmount.notEnoughBalanceForGasWarning.title, {"feeTokenSymbol":"ETH"}'
      )
    ).toBeVisible()
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      TransactionEvents.transaction_prepare_insufficient_gas,
      {
        origin: 'earn-deposit',
        networkId: NetworkId['arbitrum-sepolia'],
      }
    )

    fireEvent.press(
      getByText(
        'earnFlow.enterAmount.notEnoughBalanceForGasWarning.noGasCta, {"feeTokenSymbol":"ETH","network":"Arbitrum Sepolia"}'
      )
    )
    await waitFor(() => expect(ValoraAnalytics.track).toHaveBeenCalledTimes(2))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_deposit_add_gas_press, {
      gasTokenId: mockFeeCurrencies[0].tokenId,
    })
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeAmount, {
      tokenId: mockFeeCurrencies[0].tokenId,
      flow: CICOFlow.CashIn,
      tokenSymbol: mockFeeCurrencies[0].symbol,
    })
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
          [networkConfig.arbUsdcTokenId]: {
            tokenId: networkConfig.arbUsdcTokenId,
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

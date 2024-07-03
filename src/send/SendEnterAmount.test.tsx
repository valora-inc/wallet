import { fireEvent, render, waitFor } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { SendOrigin } from 'src/analytics/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RecipientType } from 'src/recipients/recipient'
import SendEnterAmount from 'src/send/SendEnterAmount'
import { usePrepareSendTransactions } from 'src/send/usePrepareSendTransactions'
import { getDynamicConfigParams } from 'src/statsig'
import { PreparedTransactionsPossible } from 'src/viem/prepareTransactions'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore, mockStoreBalancesToTokenBalances } from 'test/utils'
import {
  mockAccount,
  mockCeloAddress,
  mockCeloTokenBalance,
  mockCeloTokenId,
  mockCeurTokenId,
  mockCusdTokenId,
  mockPoofTokenId,
  mockTokenBalances,
  mockUSDCTokenId,
} from 'test/values'

jest.mock('src/statsig')
jest.mock('src/send/usePrepareSendTransactions')

const mockPrepareTransactionsResultPossible: PreparedTransactionsPossible = {
  type: 'possible',
  transactions: [
    {
      from: '0xfrom',
      to: '0xto',
      data: '0xdata',
      gas: BigInt(5e15), // 0.005 CELO
      maxFeePerGas: BigInt(1),
      maxPriorityFeePerGas: undefined,
      _baseFeePerGas: BigInt(1),
    },
    {
      from: '0xfrom',
      to: '0xto',
      data: '0xdata',
      gas: BigInt(1e15), // 0.001 CELO
      maxFeePerGas: BigInt(1),
      maxPriorityFeePerGas: undefined,
      _baseFeePerGas: BigInt(1),
    },
  ],
  feeCurrency: mockCeloTokenBalance,
}

const tokenBalances = {
  [mockCeloTokenId]: { ...mockTokenBalances[mockCeloTokenId], balance: '10' },
  [mockCusdTokenId]: { ...mockTokenBalances[mockCusdTokenId], balance: '10' },
  [mockUSDCTokenId]: mockTokenBalances[mockUSDCTokenId], // filtered out for networkId
  [mockPoofTokenId]: { ...mockTokenBalances[mockPoofTokenId], balance: '0' }, // filtered out for no balance
  [mockCeurTokenId]: { ...mockTokenBalances[mockCeurTokenId], balance: '100' },
}
const feeCurrencies = [
  tokenBalances[mockCeloTokenId],
  tokenBalances[mockCeurTokenId],
  tokenBalances[mockCusdTokenId],
]
const store = createMockStore({
  tokens: {
    tokenBalances,
  },
})

const refreshPreparedTransactionsSpy = jest.fn()
jest.mocked(usePrepareSendTransactions).mockReturnValue({
  prepareTransactionsResult: undefined,
  refreshPreparedTransactions: refreshPreparedTransactionsSpy,
  clearPreparedTransactions: jest.fn(),
  prepareTransactionError: undefined,
})

const params = {
  origin: SendOrigin.AppSendFlow,
  recipient: {
    recipientType: RecipientType.Address,
    address: '0x123',
  },
  isFromScan: false,
}

describe('SendEnterAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      showSend: ['celo-alfajores'],
    })
  })

  it('should render only the allowed send tokens', () => {
    const { getAllByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    const tokens = getAllByTestId('TokenBalanceItem')
    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toHaveTextContent('CELO')
    expect(tokens[1]).toHaveTextContent('cEUR')
    expect(tokens[2]).toHaveTextContent('cUSD')
  })

  it('should prepare transactions with the expected inputs', async () => {
    const defaultToken = mockStoreBalancesToTokenBalances([tokenBalances[mockCeloTokenId]])[0]
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '.25')

    await waitFor(() => expect(refreshPreparedTransactionsSpy).toHaveBeenCalledTimes(1))
    expect(refreshPreparedTransactionsSpy).toHaveBeenCalledWith({
      amount: new BigNumber('0.25'),
      token: defaultToken,
      walletAddress: mockAccount.toLowerCase(),
      recipientAddress: '0x123', // matches mock screen nav params
      feeCurrencies: mockStoreBalancesToTokenBalances(feeCurrencies),
      comment: expect.any(String),
    })
    expect(refreshPreparedTransactionsSpy.mock.calls[0][0].comment.length).toBeGreaterThanOrEqual(
      640
    )
  })

  it('should handle navigating to the next step', async () => {
    jest.mocked(usePrepareSendTransactions).mockReturnValue({
      prepareTransactionsResult: mockPrepareTransactionsResultPossible,
      refreshPreparedTransactions: jest.fn(),
      clearPreparedTransactions: jest.fn(),
      prepareTransactionError: undefined,
    })
    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '8')

    await waitFor(() => expect(getByText('review')).not.toBeDisabled())
    fireEvent.press(getByText('review'))

    await waitFor(() => expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SendEvents.send_amount_continue, {
      amountInUsd: '106.01',
      isScan: false,
      localCurrency: 'PHP',
      localCurrencyAmount: '140.99',
      localCurrencyExchangeRate: '1.33',
      networkId: 'celo-alfajores',
      origin: 'app_send_flow',
      recipientType: 'Address',
      tokenId: mockCeloTokenId,
      underlyingAmount: '8',
      underlyingTokenAddress: mockCeloAddress,
      underlyingTokenSymbol: 'CELO',
      amountEnteredIn: 'token',
    })
    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
      origin: params.origin,
      isFromScan: params.isFromScan,
      transactionData: {
        tokenId: mockCeloTokenId,
        recipient: params.recipient,
        inputAmount: new BigNumber(8),
        amountIsInLocalCurrency: false,
        tokenAddress: mockCeloAddress,
        tokenAmount: new BigNumber(8),
      },
    })
  })

  it('should set the correct default token using the last used token', () => {
    const { getByTestId } = render(
      <Provider
        store={createMockStore({
          send: {
            lastUsedTokenId: mockCeurTokenId,
          },
        })}
      >
        <MockedNavigator component={SendEnterAmount} params={params} />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('cEUR')
    expect(getByTestId('SendEnterAmount/TokenSelect')).not.toBeDisabled()
  })

  it('should set the correct default token given a token override and last used token', () => {
    const { getByTestId } = render(
      <Provider
        store={createMockStore({
          send: {
            lastUsedTokenId: mockCeurTokenId,
          },
        })}
      >
        <MockedNavigator
          component={SendEnterAmount}
          params={{ ...params, defaultTokenIdOverride: mockCusdTokenId }}
        />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('cUSD')
    expect(getByTestId('SendEnterAmount/TokenSelect')).not.toBeDisabled()
  })

  it('should disable token selection', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator
          component={SendEnterAmount}
          params={{ ...params, defaultTokenIdOverride: mockCusdTokenId, forceTokenId: true }}
        />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenSelect')).toHaveTextContent('cUSD')
    expect(getByTestId('SendEnterAmount/TokenSelect')).toBeDisabled()
  })
})

import { act, renderHook } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import { FetchMock } from 'jest-fetch-mock/types'
import React from 'react'
import { Provider } from 'react-redux'
import { usePrepareEnterAmountTransactionsCallback } from 'src/earn/hooks'
import { RawShortcutTransaction } from 'src/positions/slice'
import { ShortcutStatus } from 'src/positions/types'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { prepareTransactions } from 'src/viem/prepareTransactions'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import {
  mockAaveArbUsdcAddress,
  mockAccount,
  mockArbArbAddress,
  mockArbEthTokenId,
  mockArbUsdcTokenId,
  mockEarnPositions,
  mockPositions,
  mockShortcuts,
  mockTokenBalances,
} from 'test/values'
import { parseGwei } from 'viem'

const mockFetch = fetch as FetchMock
const gas = BigInt(100_000)
const maxFeePerGas = parseGwei('5')
const _baseFeePerGas = parseGwei('1')
const transactions = [
  {
    from: '0x2b8441ef13333ffa955c9ea5ab5b3692da95260d',
    networkId: NetworkId['celo-alfajores'],
    data: '0x3d18b912',
    to: '0xda7f463c27ec862cfbf2369f3f74c364d050d93f',
  } as const,
]
const rewardId = 'claim-reward-0xda7f463c27ec862cfbf2369f3f74c364d050d93f-0.010209368244703615'

jest.mock('src/viem/prepareTransactions')

function getMockStoreWithShortcutStatus(
  status: ShortcutStatus,
  transactions: RawShortcutTransaction[]
) {
  return createMockStore({
    positions: {
      positions: mockPositions,
      shortcuts: mockShortcuts,
      triggeredShortcutsStatus: {
        [rewardId]: {
          status,
          transactions,
          appName: 'some app name',
          appImage: 'https://some.app/image.png',
        },
      },
    },
  })
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

const mockRefreshArgs = {
  pool: mockEarnPositions[0],
  hooksApiUrl: networkConfig.hooksApiUrl,
}

const mockResponseBody = {
  message: 'OK',
  data: {
    transactions: [
      {
        networkId: NetworkId['arbitrum-sepolia'],
        from: '0xfrom',
        to: '0xto',
        data: '0xdata',
      },
    ],
  },
}

const mockSwapDepositResponseBody = {
  message: 'OK',
  data: {
    transactions: [
      {
        networkId: NetworkId['arbitrum-sepolia'],
        from: '0xfrom',
        to: '0xto',
        data: '0xdata',
      },
      {
        networkId: NetworkId['arbitrum-sepolia'],
        from: '0xfrom',
        to: '0xto',
        data: '0xdata',
        value: '0',
        gas: '2788000',
        estimatedGasUse: '892551',
      },
    ],
    dataProps: {
      swapTransaction: {
        chainId: 44787,
        buyAmount: '994820',
        sellAmount: '1785876928077378476',
        buyTokenAddress: mockArbArbAddress,
        sellTokenAddress: mockAaveArbUsdcAddress,
        price: '0.557',
        guaranteedPrice: '0.55',
        estimatedPriceImpact: '0.0',
        gas: '1800000',
        gasPrice: '10000000',
        to: '0x0000000000000000000000000000000000000123',
        value: '0',
        data: '0x0',
        from: mockAccount,
        allowanceTarget: '0x0000000000000000000000000000000000000123',
        estimatedGasUse: '971972',
        swapType: 'same-chain',
        appFeePercentageIncludedInPrice: '0.6',
        simulationStatus: 'success',
      },
    },
  },
}

const expectedPrepareTransactionsResult = {
  prepareTransactionsResult: {
    type: 'possible',
    transactions: [
      {
        from: '0xfrom',
        to: '0xto',
        data: '0xdata',
        gas,
        maxFeePerGas,
        _baseFeePerGas,
      },
    ],
    feeCurrency: mockFeeCurrencies[0],
  },
}

const expectedSwapDepositPrepareTransactionsResult = {
  prepareTransactionsResult: {
    feeCurrency: mockFeeCurrencies[0],
    transactions: [
      {
        gas,
        maxFeePerGas,
        _baseFeePerGas,
        _estimatedGasUse: undefined,
        data: '0xdata',
        from: '0xfrom',
        to: '0xto',
        value: undefined,
      },
      {
        gas,
        maxFeePerGas,
        _baseFeePerGas,
        _estimatedGasUse: BigInt(892551),
        data: '0xdata',
        from: '0xfrom',
        to: '0xto',
        value: BigInt(0),
      },
    ],
    type: 'possible',
  },
  swapTransaction: {
    allowanceTarget: '0x0000000000000000000000000000000000000123',
    appFeePercentageIncludedInPrice: '0.6',
    buyAmount: '994820',
    buyTokenAddress: mockArbArbAddress,
    chainId: 44787,
    data: '0x0',
    estimatedGasUse: '971972',
    estimatedPriceImpact: '0.0',
    from: mockAccount,
    gas: '1800000',
    gasPrice: '10000000',
    guaranteedPrice: '0.55',
    price: '0.557',
    sellAmount: '1785876928077378476',
    sellTokenAddress: mockAaveArbUsdcAddress,
    simulationStatus: 'success',
    swapType: 'same-chain',
    to: '0x0000000000000000000000000000000000000123',
    value: '0',
  },
}

describe('usePrepareEnterAmountTransactionsCallback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prepareTransactions).mockImplementation(async ({ baseTransactions }) => ({
      transactions: baseTransactions.map((tx) => ({
        ...tx,
        gas,
        maxFeePerGas,
        _baseFeePerGas,
      })),
      type: 'possible' as const,
      feeCurrency: mockFeeCurrencies[0],
    }))
  })

  it.each([
    {
      mode: 'withdraw',
      title: 'calls correct transaction preparation for withdraw',
      mockResponseBody: mockResponseBody,
      expectedPrepareTransactionsResult: expectedPrepareTransactionsResult,
      mockRefreshArgs: mockRefreshArgs,
    },
    {
      mode: 'withdraw',
      title: 'calls correct transaction preparation for partial withdraw',
      mockResponseBody: mockResponseBody,
      expectedPrepareTransactionsResult: expectedPrepareTransactionsResult,
      mockRefreshArgs: mockRefreshArgs,
    },
    {
      mode: 'deposit',
      title: 'calls correct transaction preparation for deposit',
      mockResponseBody: mockResponseBody,
      expectedPrepareTransactionsResult: expectedPrepareTransactionsResult,
      mockRefreshArgs: {
        ...mockRefreshArgs,
        token: mockTokenBalances[mockArbUsdcTokenId],
      },
    },
    {
      mode: 'swap-deposit',
      title: 'calls correct transaction preparation for swap-deposit',
      mockResponseBody: mockSwapDepositResponseBody,
      expectedPrepareTransactionsResult: expectedSwapDepositPrepareTransactionsResult,
      mockRefreshArgs: {
        ...mockRefreshArgs,
        token: mockTokenBalances[mockArbUsdcTokenId],
      },
    },
  ] as const)(
    '$title',
    async ({ mode, mockResponseBody, expectedPrepareTransactionsResult, mockRefreshArgs }) => {
      const { result } = renderHook(() => usePrepareEnterAmountTransactionsCallback(mode), {
        wrapper: (component) => (
          <Provider store={getMockStoreWithShortcutStatus('success', transactions)}>
            {component?.children ? component.children : component}
          </Provider>
        ),
      })

      mockFetch.mockResponse(JSON.stringify(mockResponseBody), {
        status: 200,
      })

      await act(async () => {
        await result.current.refreshPreparedTransactions(mockRefreshArgs)
      })

      // Validate the initial state and functions returned by the hook
      expect(result.current).toEqual({
        prepareTransactionsResult: expectedPrepareTransactionsResult,
        isPreparingTransactions: false,
        prepareTransactionError: undefined,
        refreshPreparedTransactions: expect.any(Function),
        clearPreparedTransactions: expect.any(Function),
      })
    }
  )

  it('errors when unable to trigger shortcut error response from hooks API', async () => {
    const { result } = renderHook(() => usePrepareEnterAmountTransactionsCallback('withdraw'), {
      wrapper: (component) => (
        <Provider store={getMockStoreWithShortcutStatus('success', transactions)}>
          {component?.children ? component.children : component}
        </Provider>
      ),
    })

    mockFetch.mockResponse(JSON.stringify({}), {
      status: 500,
    })

    await expect(result.current.refreshPreparedTransactions(mockRefreshArgs)).rejects.toEqual(
      new Error('Unable to trigger shortcut: 500 Internal Server Error')
    )
  })
})

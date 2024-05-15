import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call } from 'redux-saga-test-plan/matchers'
import { StaticProvider, dynamic, throwError } from 'redux-saga-test-plan/providers'
import erc20 from 'src/abis/IERC20'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { depositSubmitSaga } from 'src/earn/saga'
import { depositCancel, depositError, depositStart, depositSuccess } from 'src/earn/slice'
import { navigateHome } from 'src/navigator/NavigationService'
import { CANCELLED_PIN_INPUT } from 'src/pincode/authentication'
import { Network, NetworkId, TokenTransactionTypeV2 } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { sendPreparedTransactions } from 'src/viem/saga'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import { mockArbUsdcTokenId, mockTokenBalances, mockUSDCAddress } from 'test/values'
import { Address, decodeFunctionData } from 'viem'

jest.mock('viem')

jest.mock('src/transactions/types', () => {
  const originalModule = jest.requireActual('src/transactions/types')

  return {
    ...originalModule,
    newTransactionContext: jest.fn((tag, description) => ({
      id: `id-${tag}-${description}`,
      tag,
      description,
    })),
  }
})

describe('depositSubmitSaga', () => {
  const serializableApproveTx: SerializableTransactionRequest = {
    from: '0xa',
    to: mockUSDCAddress as Address,
    value: '100',
    data: '0x01',
    gas: '20000',
  }
  const serializableDepositTx: SerializableTransactionRequest = {
    from: '0xa',
    to: '0xc',
    value: '100',
    data: '0x02',
    gas: '50000',
  }
  const mockApproveTxReceipt = {
    status: 'success',
    blockNumber: BigInt(1234),
    transactionHash: '0x1',
    cumulativeGasUsed: BigInt(3_129_217),
    effectiveGasPrice: BigInt(5_000_000_000),
    gasUsed: BigInt(51_578),
  }
  const mockDepositTxReceipt = {
    status: 'success',
    blockNumber: BigInt(1234),
    transactionHash: '0x2',
    cumulativeGasUsed: BigInt(3_899_547),
    effectiveGasPrice: BigInt(5_000_000_000),
    gasUsed: BigInt(371_674),
  }
  const mockStandbyHandler = jest.fn()

  const sagaProviders: StaticProvider[] = [
    [
      matchers.call.fn(decodeFunctionData),
      { functionName: 'approve', args: ['0xspenderAddress', BigInt(1e8)] },
    ],
    [
      matchers.call.fn(sendPreparedTransactions),
      dynamic(({ args: [txs, _networkId, standbyHandlers] }) => {
        if (txs.length === 1) {
          mockStandbyHandler(standbyHandlers[0]('0x2'))
          return ['0x2']
        } else {
          mockStandbyHandler(standbyHandlers[0]('0x1'))
          mockStandbyHandler(standbyHandlers[1]('0x2'))
          return ['0x1', '0x2']
        }
      }),
    ],
    [
      call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' }),
      mockApproveTxReceipt,
    ],
    [
      call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' }),
      mockDepositTxReceipt,
    ],
  ]

  const expectedAnalyticsProps = {
    tokenId: mockArbUsdcTokenId,
    tokenAmount: '100',
    networkId: NetworkId['arbitrum-sepolia'],
    providerId: 'aave-v3',
  }

  const expectedApproveStandbyTx = {
    __typename: 'TokenApproval',
    context: {
      id: 'id-earn/saga-Earn/Approve',
      tag: 'earn/saga',
      description: 'Earn/Approve',
    },
    networkId: NetworkId['arbitrum-sepolia'],
    tokenId: mockArbUsdcTokenId,
    transactionHash: '0x1',
    type: TokenTransactionTypeV2.Approval,
    approvedAmount: '100',
    feeCurrencyId: undefined,
  }

  const expectedDepositStandbyTx = {
    __typename: 'TokenExchangeV3',
    context: {
      id: 'id-earn/saga-Earn/Deposit',
      tag: 'earn/saga',
      description: 'Earn/Deposit',
    },
    networkId: NetworkId['arbitrum-sepolia'],
    inAmount: {
      value: '100',
      tokenId: networkConfig.aaveArbUsdcTokenId,
    },
    outAmount: {
      value: '100',
      tokenId: mockArbUsdcTokenId,
    },
    transactionHash: '0x2',
    type: TokenTransactionTypeV2.SwapTransaction,
    feeCurrencyId: undefined,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(decodeFunctionData)
      .mockReturnValue({ functionName: 'approve', args: ['0xspenderAddress', BigInt(1e8)] })
  })

  it('sends approve and deposit transactions, navigates home and dispatches the success action', async () => {
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: {
        amount: '100',
        tokenId: mockArbUsdcTokenId,
        preparedTransactions: [serializableApproveTx, serializableDepositTx],
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(depositSuccess())
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' })
      .run()
    expect(navigateHome).toHaveBeenCalled()
    expect(decodeFunctionData).toHaveBeenCalledWith({
      abi: erc20.abi,
      data: serializableApproveTx.data,
    })
    expect(mockStandbyHandler).toHaveBeenCalledTimes(2)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, expectedApproveStandbyTx)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(2, expectedDepositStandbyTx)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_start,
      expectedAnalyticsProps
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_success,
      expectedAnalyticsProps
    )
  })

  it('sends only deposit transaction, navigates home and dispatches the success action', async () => {
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: {
        amount: '100',
        tokenId: mockArbUsdcTokenId,
        preparedTransactions: [serializableDepositTx],
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(depositSuccess())
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' })
      .run()
    expect(navigateHome).toHaveBeenCalled()
    expect(decodeFunctionData).not.toHaveBeenCalled()
    expect(mockStandbyHandler).toHaveBeenCalledTimes(1)
    expect(mockStandbyHandler).toHaveBeenCalledWith(expectedDepositStandbyTx)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_start,
      expectedAnalyticsProps
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_success,
      expectedAnalyticsProps
    )
  })

  it('dispatches cancel action if pin input is cancelled and does not navigate home', async () => {
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: {
        amount: '100',
        tokenId: mockArbUsdcTokenId,
        preparedTransactions: [serializableDepositTx],
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide([
        // providers run top down so this will take precedence over the one in sagaProviders
        [matchers.call.fn(sendPreparedTransactions), throwError(CANCELLED_PIN_INPUT as any)],
        ...sagaProviders,
      ])
      .put(depositCancel())
      .call.like({ fn: sendPreparedTransactions })
      .not.call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'])
      .run()
    expect(navigateHome).not.toHaveBeenCalled()
    expect(decodeFunctionData).not.toHaveBeenCalled()
    expect(mockStandbyHandler).not.toHaveBeenCalled()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_start,
      expectedAnalyticsProps
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_cancel,
      expectedAnalyticsProps
    )
  })

  it('dispatches error action if transaction submission fails and does not navigate home', async () => {
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: {
        amount: '100',
        tokenId: mockArbUsdcTokenId,
        preparedTransactions: [serializableDepositTx],
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide([
        [matchers.call.fn(sendPreparedTransactions), throwError(new Error('Transaction failed'))],
        ...sagaProviders,
      ])
      .put(depositError())
      .call.like({ fn: sendPreparedTransactions })
      .not.call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'])
      .run()
    expect(navigateHome).not.toHaveBeenCalled()
    expect(decodeFunctionData).not.toHaveBeenCalled()
    expect(mockStandbyHandler).not.toHaveBeenCalled()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_start,
      expectedAnalyticsProps
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_deposit_submit_error, {
      ...expectedAnalyticsProps,
      error: 'Transaction failed',
    })
  })

  it('dispatches error action and navigates home if deposit transaction status is reverted', async () => {
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: {
        amount: '100',
        tokenId: mockArbUsdcTokenId,
        preparedTransactions: [serializableApproveTx, serializableDepositTx],
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide([
        [
          call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' }),
          { ...mockDepositTxReceipt, status: 'reverted' },
        ],
        ...sagaProviders,
      ])
      .put(depositError())
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' })
      .run()
    expect(navigateHome).toHaveBeenCalled()
    expect(decodeFunctionData).toHaveBeenCalledWith({
      abi: erc20.abi,
      data: serializableApproveTx.data,
    })
    expect(mockStandbyHandler).toHaveBeenCalledTimes(2)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, expectedApproveStandbyTx)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(2, expectedDepositStandbyTx)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_start,
      expectedAnalyticsProps
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_deposit_submit_error, {
      ...expectedAnalyticsProps,
      error: 'Deposit transaction reverted: 0x2',
    })
  })
})

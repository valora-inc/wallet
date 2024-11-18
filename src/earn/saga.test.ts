import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call } from 'redux-saga-test-plan/matchers'
import { StaticProvider, dynamic, throwError } from 'redux-saga-test-plan/providers'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { depositSubmitSaga, withdrawSubmitSaga } from 'src/earn/saga'
import {
  depositCancel,
  depositError,
  depositStart,
  depositSuccess,
  withdrawCancel,
  withdrawError,
  withdrawStart,
  withdrawSuccess,
} from 'src/earn/slice'
import { isGasSubsidizedForNetwork } from 'src/earn/utils'
import { navigateHome } from 'src/navigator/NavigationService'
import { CANCELLED_PIN_INPUT } from 'src/pincode/authentication'
import { EarnPosition } from 'src/positions/types'
import { Network, NetworkId, TokenTransactionTypeV2 } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { sendPreparedTransactions } from 'src/viem/saga'
import { createMockStore } from 'test/utils'
import {
  mockAaveArbUsdcTokenId,
  mockArbArbAddress,
  mockArbArbTokenId,
  mockArbUsdcTokenId,
  mockEarnPositions,
  mockRewardsPositions,
  mockTokenBalances,
  mockUSDCAddress,
} from 'test/values'
import { Address, decodeFunctionData, erc20Abi } from 'viem'

jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  decodeFunctionData: jest.fn(() => ({
    functionName: 'approve',
    args: ['0xspenderAddress', BigInt(1e8)],
  })),
}))

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

jest.mock('src/earn/utils')

const mockTxReceipt1 = {
  status: 'success',
  blockNumber: BigInt(1234),
  transactionHash: '0x1',
  cumulativeGasUsed: BigInt(3_129_217),
  effectiveGasPrice: BigInt(5_000_000_000),
  gasUsed: BigInt(51_578),
}
const mockTxReceipt2 = {
  status: 'success',
  blockNumber: BigInt(1234),
  transactionHash: '0x2',
  cumulativeGasUsed: BigInt(3_899_547),
  effectiveGasPrice: BigInt(5_000_000_000),
  gasUsed: BigInt(371_674),
}

describe('depositSubmitSaga', () => {
  const serializableApproveTx: SerializableTransactionRequest = {
    from: '0xa',
    to: mockUSDCAddress as Address,
    value: '100',
    data: '0x01',
    gas: '20000',
    maxFeePerGas: '12000000000',
    _baseFeePerGas: '6000000000',
  }
  const serializableDepositTx: SerializableTransactionRequest = {
    from: '0xa',
    to: '0xc',
    value: '100',
    data: '0x02',
    gas: '50000',
    maxFeePerGas: '12000000000',
    _baseFeePerGas: '6000000000',
  }

  const mockStandbyHandler = jest.fn()
  const mockIsGasSubsidizedCheck = jest.fn() // a mock to ensure sendPreparedTransactions is called with the correct isGasSubsidized value

  const sagaProviders: StaticProvider[] = [
    [
      matchers.call.fn(decodeFunctionData),
      { functionName: 'approve', args: ['0xspenderAddress', BigInt(1e8)] },
    ],
    [
      matchers.call.fn(sendPreparedTransactions),
      dynamic(({ args: [txs, _networkId, standbyHandlers, isGasSubsidized] }) => {
        mockIsGasSubsidizedCheck(isGasSubsidized)
        if (txs.length === 1) {
          mockStandbyHandler(standbyHandlers[0]('0x2'))
          return ['0x2']
        } else {
          return (txs as any[]).map((_tx, i) => {
            const hash = `0x${i + 1}`
            mockStandbyHandler(standbyHandlers[i](`0x${i + 1}`))
            return hash
          })
        }
      }),
    ],
    [
      call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' }),
      mockTxReceipt1,
    ],
    [
      call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' }),
      mockTxReceipt2,
    ],
    [
      call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x3' }),
      mockTxReceipt2,
    ],
  ]

  const expectedAnalyticsProps = {
    depositTokenId: mockArbUsdcTokenId,
    depositTokenAmount: '100',
    networkId: NetworkId['arbitrum-sepolia'],
    providerId: mockEarnPositions[0].appId,
    poolId: mockEarnPositions[0].positionId,
    mode: 'deposit',
    fromTokenAmount: '100',
    fromTokenId: mockArbUsdcTokenId,
  }

  const expectedApproveStandbyTx = {
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
    context: {
      id: 'id-earn/saga-Earn/Deposit',
      tag: 'earn/saga',
      description: 'Earn/Deposit',
    },
    networkId: NetworkId['arbitrum-sepolia'],
    inAmount: {
      value: '100',
      tokenId: mockAaveArbUsdcTokenId,
    },
    outAmount: {
      value: '100',
      tokenId: mockArbUsdcTokenId,
    },
    transactionHash: '0x2',
    type: TokenTransactionTypeV2.EarnDeposit,
    feeCurrencyId: undefined,
    providerId: mockEarnPositions[0].appId,
  }

  const expectedSwapDepositStandbyTx = {
    context: {
      id: 'id-earn/saga-Earn/SwapDeposit',
      tag: 'earn/saga',
      description: 'Earn/SwapDeposit',
    },
    networkId: NetworkId['arbitrum-sepolia'],
    swap: {
      inAmount: {
        value: '100',
        tokenId: mockArbUsdcTokenId,
      },
      outAmount: {
        value: '50',
        tokenId: mockArbArbTokenId,
      },
    },
    deposit: {
      inAmount: {
        value: '100',
        tokenId: mockAaveArbUsdcTokenId,
      },
      outAmount: {
        value: '100',
        tokenId: mockArbUsdcTokenId,
      },
      providerId: mockEarnPositions[0].appId,
    },
    transactionHash: '0x2',
    type: TokenTransactionTypeV2.EarnSwapDeposit,
    feeCurrencyId: undefined,
  }

  const expectedApproveGasAnalyticsProperties = {
    approveTxCumulativeGasUsed: 3129217,
    approveTxEffectiveGasPrice: 5000000000,
    approveTxEstimatedGasFee: 0.00012,
    approveTxEstimatedGasFeeUsd: 0.18,
    approveTxFeeCurrency: undefined,
    approveTxFeeCurrencySymbol: 'ETH',
    approveTxGas: 20000,
    approveTxGasFee: 0.00025789,
    approveTxGasFeeUsd: 0.386835,
    approveTxGasUsed: 51578,
    approveTxHash: '0x1',
    approveTxMaxGasFee: 0.00024,
    approveTxMaxGasFeeUsd: 0.36,
  }

  const expectedDepositGasAnalyticsProperties = {
    depositTxCumulativeGasUsed: 3899547,
    depositTxEffectiveGasPrice: 5000000000,
    depositTxEstimatedGasFee: 0.0003,
    depositTxEstimatedGasFeeUsd: 0.45,
    depositTxFeeCurrency: undefined,
    depositTxFeeCurrencySymbol: 'ETH',
    depositTxGas: 50000,
    depositTxGasFee: 0.00185837,
    depositTxGasFeeUsd: 2.787555,
    depositTxGasUsed: 371674,
    depositTxHash: '0x2',
    depositTxMaxGasFee: 0.0006,
    depositTxMaxGasFeeUsd: 0.9,
  }

  const expectedCumulativeGasAnalyticsProperties = {
    gasFee: 0.00211626,
    gasFeeUsd: 3.17439,
    gasUsed: 423252,
    ...expectedApproveGasAnalyticsProperties,
    ...expectedDepositGasAnalyticsProperties,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(isGasSubsidizedForNetwork).mockReturnValue(false)
    jest.mocked(decodeFunctionData).mockReturnValue({
      functionName: 'approve',
      args: ['0xspenderAddress', BigInt(1e8)],
    })
  })

  it('sends approve and deposit transactions, navigates home and dispatches the success action (gas subsidy on)', async () => {
    jest.mocked(isGasSubsidizedForNetwork).mockReturnValue(true)
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: {
        amount: '100',
        pool: mockEarnPositions[0],
        preparedTransactions: [serializableApproveTx, serializableDepositTx],
        mode: 'deposit',
        fromTokenAmount: '100',
        fromTokenId: mockArbUsdcTokenId,
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(
        depositSuccess({
          tokenId: mockArbUsdcTokenId,
          networkId: NetworkId['arbitrum-sepolia'],
          transactionHash: '0x2',
        })
      )
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' })
      .run()
    expect(navigateHome).toHaveBeenCalled()
    expect(decodeFunctionData).toHaveBeenCalledWith({
      abi: erc20Abi,
      data: serializableApproveTx.data,
    })
    expect(mockStandbyHandler).toHaveBeenCalledTimes(2)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, expectedApproveStandbyTx)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(2, expectedDepositStandbyTx)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_start,
      expectedAnalyticsProps
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_deposit_submit_success, {
      ...expectedAnalyticsProps,
      ...expectedCumulativeGasAnalyticsProperties,
    })
    expect(mockIsGasSubsidizedCheck).toHaveBeenCalledWith(true)
    expect(mockIsGasSubsidizedCheck).not.toHaveBeenCalledWith(false)
  })

  it('sends only deposit transaction, navigates home and dispatches the success action (gas subsidy off)', async () => {
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: {
        amount: '100',
        pool: mockEarnPositions[0],
        preparedTransactions: [serializableDepositTx],
        mode: 'deposit',
        fromTokenAmount: '100',
        fromTokenId: mockArbUsdcTokenId,
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(
        depositSuccess({
          tokenId: mockArbUsdcTokenId,
          networkId: NetworkId['arbitrum-sepolia'],
          transactionHash: '0x2',
        })
      )
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' })
      .run()
    expect(navigateHome).toHaveBeenCalled()
    expect(decodeFunctionData).not.toHaveBeenCalled()
    expect(mockStandbyHandler).toHaveBeenCalledTimes(1)
    expect(mockStandbyHandler).toHaveBeenCalledWith(expectedDepositStandbyTx)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_start,
      expectedAnalyticsProps
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_deposit_submit_success, {
      ...expectedAnalyticsProps,
      ...expectedDepositGasAnalyticsProperties,
      gasFee: 0.00185837,
      gasFeeUsd: 2.787555,
      gasUsed: 371674,
    })
    expect(mockIsGasSubsidizedCheck).toHaveBeenCalledWith(false)
    expect(mockIsGasSubsidizedCheck).not.toHaveBeenCalledWith(true)
  })

  it('sends approve and swap-deposit transactions, navigates home and dispatches the success action (gas subsidy off)', async () => {
    jest.mocked(decodeFunctionData).mockReturnValue({
      functionName: 'approve',
      args: ['0xspenderAddress', BigInt(5e19)],
    })
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: {
        amount: '100',
        pool: mockEarnPositions[0],
        preparedTransactions: [
          { ...serializableApproveTx, to: mockArbArbAddress as Address },
          serializableDepositTx,
        ],
        mode: 'swap-deposit',
        fromTokenAmount: '50',
        fromTokenId: mockArbArbTokenId,
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(
        depositSuccess({
          tokenId: mockArbUsdcTokenId,
          networkId: NetworkId['arbitrum-sepolia'],
          transactionHash: '0x2',
        })
      )
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' })
      .run()
    expect(navigateHome).toHaveBeenCalled()
    expect(decodeFunctionData).toHaveBeenCalledWith({
      abi: erc20Abi,
      data: serializableApproveTx.data,
    })
    expect(mockStandbyHandler).toHaveBeenCalledTimes(2)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, {
      ...expectedApproveStandbyTx,
      approvedAmount: '50',
      tokenId: mockArbArbTokenId,
    })
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(2, expectedSwapDepositStandbyTx)
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_deposit_submit_start, {
      ...expectedAnalyticsProps,
      fromTokenAmount: '50',
      fromTokenId: mockArbArbTokenId,
      mode: 'swap-deposit',
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_deposit_submit_success, {
      ...expectedAnalyticsProps,
      ...expectedCumulativeGasAnalyticsProperties,
      fromTokenAmount: '50',
      fromTokenId: mockArbArbTokenId,
      mode: 'swap-deposit',
    })
    expect(mockIsGasSubsidizedCheck).toHaveBeenCalledWith(false)
    expect(mockIsGasSubsidizedCheck).not.toHaveBeenCalledWith(true)
  })

  it('sends only swap-deposit transaction, navigates home and dispatches the success action (gas subsidy on)', async () => {
    jest.mocked(isGasSubsidizedForNetwork).mockReturnValue(true)
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: {
        amount: '100',
        pool: mockEarnPositions[0],
        preparedTransactions: [serializableDepositTx],
        mode: 'swap-deposit',
        fromTokenAmount: '50',
        fromTokenId: mockArbArbTokenId,
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(
        depositSuccess({
          tokenId: mockArbUsdcTokenId,
          networkId: NetworkId['arbitrum-sepolia'],
          transactionHash: '0x2',
        })
      )
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' })
      .run()
    expect(navigateHome).toHaveBeenCalled()
    expect(decodeFunctionData).not.toHaveBeenCalled()
    expect(mockStandbyHandler).toHaveBeenCalledTimes(1)
    expect(mockStandbyHandler).toHaveBeenCalledWith(expectedSwapDepositStandbyTx)
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_deposit_submit_start, {
      ...expectedAnalyticsProps,
      fromTokenAmount: '50',
      fromTokenId: mockArbArbTokenId,
      mode: 'swap-deposit',
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_deposit_submit_success, {
      ...expectedAnalyticsProps,
      ...expectedDepositGasAnalyticsProperties,
      gasFee: 0.00185837,
      gasFeeUsd: 2.787555,
      gasUsed: 371674,
      fromTokenAmount: '50',
      fromTokenId: mockArbArbTokenId,
      mode: 'swap-deposit',
    })
    expect(mockIsGasSubsidizedCheck).toHaveBeenCalledWith(true)
    expect(mockIsGasSubsidizedCheck).not.toHaveBeenCalledWith(false)
  })

  it('uses null standby transactions if there are more than two prepared transactions', async () => {
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: {
        amount: '100',
        pool: mockEarnPositions[0],
        preparedTransactions: [
          serializableApproveTx,
          serializableDepositTx,
          { ...serializableDepositTx, to: '0xd' },
        ],
        mode: 'deposit',
        fromTokenAmount: '100',
        fromTokenId: mockArbUsdcTokenId,
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(
        depositSuccess({
          tokenId: mockArbUsdcTokenId,
          networkId: NetworkId['arbitrum-sepolia'],
          transactionHash: '0x3',
        })
      )
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x3' })
      .run()
    expect(navigateHome).toHaveBeenCalled()
    expect(decodeFunctionData).not.toHaveBeenCalled()
    expect(mockStandbyHandler).toHaveBeenCalledTimes(3)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, null)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(2, null)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(3, null)
  })

  it('uses null standby transaction for approve if there are two prepared transactions and the first is not approve', async () => {
    jest.mocked(decodeFunctionData).mockReturnValue({
      functionName: 'not-approve',
      args: ['0xspenderAddress', BigInt(5e19)],
    })
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: {
        amount: '100',
        pool: mockEarnPositions[0],
        preparedTransactions: [
          { ...serializableApproveTx, to: mockArbArbAddress as Address },
          serializableDepositTx,
        ],
        mode: 'swap-deposit',
        fromTokenAmount: '50',
        fromTokenId: mockArbArbTokenId,
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(
        depositSuccess({
          tokenId: mockArbUsdcTokenId,
          networkId: NetworkId['arbitrum-sepolia'],
          transactionHash: '0x2',
        })
      )
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' })
      .run()
    expect(navigateHome).toHaveBeenCalled()
    expect(decodeFunctionData).toHaveBeenCalledWith({
      abi: erc20Abi,
      data: serializableApproveTx.data,
    })
    expect(mockStandbyHandler).toHaveBeenCalledTimes(2)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, null)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(2, expectedSwapDepositStandbyTx)
  })

  it('dispatches cancel action if pin input is cancelled and does not navigate home', async () => {
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: {
        amount: '100',
        pool: mockEarnPositions[0],
        preparedTransactions: [serializableDepositTx],
        mode: 'deposit',
        fromTokenAmount: '100',
        fromTokenId: mockArbUsdcTokenId,
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
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_start,
      expectedAnalyticsProps
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_cancel,
      expectedAnalyticsProps
    )
  })

  it('dispatches error action if transaction submission fails and does not navigate home', async () => {
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: {
        amount: '100',
        pool: mockEarnPositions[0],
        preparedTransactions: [serializableDepositTx],
        mode: 'deposit',
        fromTokenAmount: '100',
        fromTokenId: mockArbUsdcTokenId,
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
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_start,
      expectedAnalyticsProps
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_error,
      expect.objectContaining({
        ...expectedAnalyticsProps,
        error: 'Transaction failed',
      })
    )
  })

  it('dispatches error action and navigates home if deposit transaction status is reverted', async () => {
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: {
        amount: '100',
        pool: mockEarnPositions[0],
        preparedTransactions: [serializableApproveTx, serializableDepositTx],
        mode: 'deposit',
        fromTokenAmount: '100',
        fromTokenId: mockArbUsdcTokenId,
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide([
        [
          call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' }),
          { ...mockTxReceipt2, status: 'reverted' },
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
      abi: erc20Abi,
      data: serializableApproveTx.data,
    })
    expect(mockStandbyHandler).toHaveBeenCalledTimes(2)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, expectedApproveStandbyTx)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(2, expectedDepositStandbyTx)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_submit_start,
      expectedAnalyticsProps
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_deposit_submit_error, {
      ...expectedAnalyticsProps,
      error: 'Deposit transaction reverted: 0x2',
      ...expectedCumulativeGasAnalyticsProperties,
    })
  })
})

describe('withdrawSubmitSaga', () => {
  const mockRewards = [
    { tokenId: 'arbitrum-sepolia:0x912ce59144191c1204e64559fe8253a0e49e6548', amount: '0.01' },
  ]
  const mockPool = mockRewardsPositions[0] as EarnPosition
  const serializableWithdrawTx: SerializableTransactionRequest = {
    from: '0xa',
    to: '0xb',
    value: '100',
    data: '0x02',
    gas: '20000',
  }
  const serializableClaimRewardTx: SerializableTransactionRequest = {
    from: '0xa',
    to: '0xc',
    value: '100',
    data: '0x01',
    gas: '50000',
  }

  const mockStandbyHandler = jest.fn()
  const mockIsGasSubsidizedCheck = jest.fn() // a mock to ensure sendPreparedTransactions is called with the correct isGasSubsidized value

  const sagaProviders: StaticProvider[] = [
    [
      matchers.call.fn(sendPreparedTransactions),
      dynamic(({ args: [txs, _networkId, standbyHandlers, isGasSubsidized] }) => {
        mockIsGasSubsidizedCheck(isGasSubsidized)
        if (txs.length === 1) {
          mockStandbyHandler(standbyHandlers[0]('0x1'))
          return ['0x1']
        } else {
          mockStandbyHandler(standbyHandlers[0]('0x1'))
          mockStandbyHandler(standbyHandlers[1]('0x2'))
          return ['0x1', '0x2']
        }
      }),
    ],
    [
      call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' }),
      mockTxReceipt1,
    ],
    [
      call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' }),
      mockTxReceipt2,
    ],
  ]

  const expectedAnalyticsPropsWithRewards = {
    depositTokenId: mockArbUsdcTokenId,
    tokenAmount: '10.75',
    networkId: NetworkId['arbitrum-sepolia'],
    providerId: 'aave',
    rewards: mockRewards,
    poolId: mockRewardsPositions[0].positionId,
    mode: 'withdraw',
  }

  const expectedAnalyticsPropsClaim = {
    depositTokenId: mockArbUsdcTokenId,
    networkId: NetworkId['arbitrum-sepolia'],
    providerId: 'aave',
    rewards: mockRewards,
    poolId: mockRewardsPositions[0].positionId,
    mode: 'claim-rewards',
  }

  const expectedAnalyticsPropsNoRewards = {
    ...expectedAnalyticsPropsWithRewards,
    rewards: [],
  }

  const expectedWithdrawStandbyTx = {
    context: {
      id: 'id-earn/saga-Earn/Withdraw',
      tag: 'earn/saga',
      description: 'Earn/Withdraw',
    },
    networkId: NetworkId['arbitrum-sepolia'],
    inAmount: {
      value: '10.75',
      tokenId: mockArbUsdcTokenId,
    },
    outAmount: {
      value: '10.75',
      tokenId: mockAaveArbUsdcTokenId,
    },
    transactionHash: '0x1',
    type: TokenTransactionTypeV2.EarnWithdraw,
    feeCurrencyId: undefined,
    providerId: 'aave',
  }

  // TODO: replace with EarnClaimReward type
  const expectedClaimRewardTx = {
    context: {
      id: 'id-earn/saga-Earn/ClaimReward-1',
      tag: 'earn/saga',
      description: 'Earn/ClaimReward-1',
    },
    networkId: NetworkId['arbitrum-sepolia'],
    amount: {
      value: '0.01',
      tokenId: mockArbArbTokenId,
    },
    transactionHash: '0x2',
    type: TokenTransactionTypeV2.EarnClaimReward,
    feeCurrencyId: undefined,
    providerId: 'aave',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(isGasSubsidizedForNetwork).mockReturnValue(false)
  })

  it('sends withdraw and claim transactions, navigates home and dispatches the success action (gas subsidy off)', async () => {
    await expectSaga(withdrawSubmitSaga, {
      type: withdrawStart.type,
      payload: {
        pool: mockPool,
        preparedTransactions: [serializableWithdrawTx, serializableClaimRewardTx],
        rewardsTokens: mockRewardsPositions[1].tokens,
        mode: 'withdraw',
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(withdrawSuccess())
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' })
      .run()

    expect(navigateHome).toHaveBeenCalled()
    expect(mockStandbyHandler).toHaveBeenCalledTimes(2)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, expectedWithdrawStandbyTx)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(2, expectedClaimRewardTx)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_start,
      expectedAnalyticsPropsWithRewards
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_success,
      expectedAnalyticsPropsWithRewards
    )
    expect(mockIsGasSubsidizedCheck).toHaveBeenCalledWith(false)
    expect(mockIsGasSubsidizedCheck).not.toHaveBeenCalledWith(true)
  })

  it('sends withdraw and claim transactions, navigates home and dispatches the success action (amount set & gas subsidy off)', async () => {
    await expectSaga(withdrawSubmitSaga, {
      type: withdrawStart.type,
      payload: {
        pool: mockPool,
        preparedTransactions: [serializableWithdrawTx, serializableClaimRewardTx],
        rewardsTokens: mockRewardsPositions[1].tokens,
        amount: '5',
        mode: 'withdraw',
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(withdrawSuccess())
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' })
      .run()

    expect(navigateHome).toHaveBeenCalled()
    expect(mockStandbyHandler).toHaveBeenCalledTimes(2)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, {
      ...expectedWithdrawStandbyTx,
      inAmount: { ...expectedWithdrawStandbyTx.inAmount, value: '5' },
      outAmount: { ...expectedWithdrawStandbyTx.outAmount, value: '5' },
    })
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(2, expectedClaimRewardTx)
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_withdraw_submit_start, {
      ...expectedAnalyticsPropsWithRewards,
      tokenAmount: '5',
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_withdraw_submit_success, {
      ...expectedAnalyticsPropsWithRewards,
      tokenAmount: '5',
    })
    expect(mockIsGasSubsidizedCheck).toHaveBeenCalledWith(false)
    expect(mockIsGasSubsidizedCheck).not.toHaveBeenCalledWith(true)
  })

  it('sends only withdraw if there are no rewards (gas subsidy on)', async () => {
    jest.mocked(isGasSubsidizedForNetwork).mockReturnValue(true)
    await expectSaga(withdrawSubmitSaga, {
      type: withdrawStart.type,
      payload: {
        pool: mockPool,
        preparedTransactions: [serializableWithdrawTx],
        rewardsTokens: [],
        mode: 'withdraw',
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(withdrawSuccess())
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
      .run()

    expect(navigateHome).toHaveBeenCalled()
    expect(mockStandbyHandler).toHaveBeenCalledTimes(1)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, expectedWithdrawStandbyTx)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_start,
      expectedAnalyticsPropsNoRewards
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_success,
      expectedAnalyticsPropsNoRewards
    )
    expect(mockIsGasSubsidizedCheck).toHaveBeenCalledWith(true)
    expect(mockIsGasSubsidizedCheck).not.toHaveBeenCalledWith(false)
  })

  it('sends only withdraw to standby handler if withdrawalIncludesClaim is true (gas subsidy off)', async () => {
    await expectSaga(withdrawSubmitSaga, {
      type: withdrawStart.type,
      payload: {
        pool: {
          ...mockPool,
          dataProps: {
            ...mockPool.dataProps,
            withdrawalIncludesClaim: true,
          },
        },
        preparedTransactions: [serializableWithdrawTx],
        rewardsTokens: mockRewardsPositions[1].tokens,
        amount: '5',
        mode: 'withdraw',
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(withdrawSuccess())
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
      .run()

    expect(navigateHome).toHaveBeenCalled()
    expect(mockStandbyHandler).toHaveBeenCalledTimes(1)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, {
      ...expectedWithdrawStandbyTx,
      inAmount: { ...expectedWithdrawStandbyTx.inAmount, value: '5' },
      outAmount: { ...expectedWithdrawStandbyTx.outAmount, value: '5' },
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_withdraw_submit_start, {
      ...expectedAnalyticsPropsWithRewards,
      tokenAmount: '5',
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_withdraw_submit_success, {
      ...expectedAnalyticsPropsWithRewards,
      tokenAmount: '5',
    })
    expect(mockIsGasSubsidizedCheck).toHaveBeenCalledWith(false)
    expect(mockIsGasSubsidizedCheck).not.toHaveBeenCalledWith(true)
  })

  it('dispatches cancel action if pin input is cancelled and does not navigate home (withdraw)', async () => {
    await expectSaga(withdrawSubmitSaga, {
      type: withdrawStart.type,
      payload: {
        pool: mockPool,
        preparedTransactions: [serializableWithdrawTx, serializableClaimRewardTx],
        rewardsTokens: [],
        mode: 'withdraw',
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide([
        [matchers.call.fn(sendPreparedTransactions), throwError(CANCELLED_PIN_INPUT as any)],
        ...sagaProviders,
      ])
      .put(withdrawCancel())
      .call.like({ fn: sendPreparedTransactions })
      .not.call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'])
      .run()
    expect(navigateHome).not.toHaveBeenCalled()
    expect(mockStandbyHandler).not.toHaveBeenCalled()
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_start,
      expectedAnalyticsPropsNoRewards
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_cancel,
      expectedAnalyticsPropsNoRewards
    )
  })

  it('dispatches error action if transaction submission fails and does not navigate home', async () => {
    await expectSaga(withdrawSubmitSaga, {
      type: withdrawStart.type,
      payload: {
        pool: mockPool,
        preparedTransactions: [serializableWithdrawTx, serializableClaimRewardTx],
        rewardsTokens: mockRewardsPositions[1].tokens,
        mode: 'withdraw',
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide([
        [matchers.call.fn(sendPreparedTransactions), throwError(new Error('Transaction failed'))],
        ...sagaProviders,
      ])
      .put(withdrawError())
      .call.like({ fn: sendPreparedTransactions })
      .not.call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'])
      .run()
    expect(navigateHome).not.toHaveBeenCalled()
    expect(decodeFunctionData).not.toHaveBeenCalled()
    expect(mockStandbyHandler).not.toHaveBeenCalled()
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_start,
      expectedAnalyticsPropsWithRewards
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_withdraw_submit_error, {
      ...expectedAnalyticsPropsWithRewards,
      error: 'Transaction failed',
    })
  })

  it.each([
    { txType: 'withdraw', receipt: mockTxReceipt1, hash: '0x1', num: 1 },
    { txType: 'claim reward', receipt: mockTxReceipt2, hash: '0x2', num: 2 },
  ])(
    'dispatches error action and navigates home if $txType transaction status is reverted',
    async ({ receipt, hash, num }) => {
      await expectSaga(withdrawSubmitSaga, {
        type: withdrawStart.type,
        payload: {
          pool: mockPool,
          preparedTransactions: [serializableWithdrawTx, serializableClaimRewardTx],
          rewardsTokens: mockRewardsPositions[1].tokens,
          mode: 'withdraw',
        },
      })
        .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
        .provide([
          [
            call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash }),
            { ...receipt, status: 'reverted' },
          ],
          ...sagaProviders,
        ])
        .put(withdrawError())
        .call.like({ fn: sendPreparedTransactions })
        .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
        .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' })
        .run()
      expect(navigateHome).toHaveBeenCalled()
      expect(mockStandbyHandler).toHaveBeenCalledTimes(2)
      expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, expectedWithdrawStandbyTx)
      expect(mockStandbyHandler).toHaveBeenNthCalledWith(2, expectedClaimRewardTx)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        EarnEvents.earn_withdraw_submit_start,
        expectedAnalyticsPropsWithRewards
      )
      expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_withdraw_submit_error, {
        ...expectedAnalyticsPropsWithRewards,
        error: `Transaction ${num} reverted: ${hash}`,
      })
    }
  )

  it('sends claim transaction, navigates home and dispatches the success action (gas subsidy off)', async () => {
    await expectSaga(withdrawSubmitSaga, {
      type: withdrawStart.type,
      payload: {
        pool: mockPool,
        preparedTransactions: [serializableClaimRewardTx],
        rewardsTokens: mockRewardsPositions[1].tokens,
        mode: 'claim-rewards',
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(withdrawSuccess())
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
      .run()

    expect(navigateHome).toHaveBeenCalled()
    expect(mockStandbyHandler).toHaveBeenCalledTimes(1)
    expect(mockStandbyHandler).toHaveBeenCalledWith({
      ...expectedClaimRewardTx,
      transactionHash: '0x1',
    })

    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_start,
      expectedAnalyticsPropsClaim
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_success,
      expectedAnalyticsPropsClaim
    )
    expect(mockIsGasSubsidizedCheck).toHaveBeenCalledWith(false)
    expect(mockIsGasSubsidizedCheck).not.toHaveBeenCalledWith(true)
  })

  it('dispatches cancel action if pin input is cancelled and does not navigate home (claim-rewards)', async () => {
    await expectSaga(withdrawSubmitSaga, {
      type: withdrawStart.type,
      payload: {
        pool: mockPool,
        preparedTransactions: [serializableClaimRewardTx],
        rewardsTokens: mockRewardsPositions[1].tokens,
        mode: 'claim-rewards',
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide([
        [matchers.call.fn(sendPreparedTransactions), throwError(CANCELLED_PIN_INPUT as any)],
        ...sagaProviders,
      ])
      .put(withdrawCancel())
      .call.like({ fn: sendPreparedTransactions })
      .not.call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'])
      .run()
    expect(navigateHome).not.toHaveBeenCalled()
    expect(mockStandbyHandler).not.toHaveBeenCalled()
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_start,
      expectedAnalyticsPropsClaim
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_cancel,
      expectedAnalyticsPropsClaim
    )
  })
})

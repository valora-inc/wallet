import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call } from 'redux-saga-test-plan/matchers'
import { StaticProvider, dynamic, throwError } from 'redux-saga-test-plan/providers'
import erc20 from 'src/abis/IERC20'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
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
import { navigateHome } from 'src/navigator/NavigationService'
import { CANCELLED_PIN_INPUT } from 'src/pincode/authentication'
import { fetchTokenBalances } from 'src/tokens/slice'
import { Network, NetworkId, TokenTransactionTypeV2 } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { sendPreparedTransactions } from 'src/viem/saga'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import {
  mockArbArbTokenId,
  mockArbUsdcTokenId,
  mockTokenBalances,
  mockUSDCAddress,
} from 'test/values'
import { Address, decodeFunctionData } from 'viem'

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
  }
  const serializableDepositTx: SerializableTransactionRequest = {
    from: '0xa',
    to: '0xc',
    value: '100',
    data: '0x02',
    gas: '50000',
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
      mockTxReceipt1,
    ],
    [
      call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' }),
      mockTxReceipt2,
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
    __typename: 'EarnDeposit',
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
    type: TokenTransactionTypeV2.EarnDeposit,
    feeCurrencyId: undefined,
    providerId: 'aave-v3',
  }

  beforeEach(() => {
    jest.clearAllMocks()
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
      .put(fetchTokenBalances({ showLoading: false }))
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
      .put(fetchTokenBalances({ showLoading: false }))
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
      .not.put.actionType(fetchTokenBalances.type)
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
      .not.put.actionType(fetchTokenBalances.type)
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
          { ...mockTxReceipt2, status: 'reverted' },
        ],
        ...sagaProviders,
      ])
      .put(depositError())
      .not.put.actionType(fetchTokenBalances.type)
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

describe('withdrawSubmitSaga', () => {
  const mockRewards = [{ tokenId: mockArbArbTokenId, amount: '1' }]
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

  const sagaProviders: StaticProvider[] = [
    [
      matchers.call.fn(sendPreparedTransactions),
      dynamic(({ args: [txs, _networkId, standbyHandlers] }) => {
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
    tokenId: mockArbUsdcTokenId,
    tokenAmount: '100',
    networkId: NetworkId['arbitrum-sepolia'],
    providerId: 'aave-v3',
    rewards: mockRewards,
  }

  const expectedAnalyticsPropsNoRewards = {
    ...expectedAnalyticsPropsWithRewards,
    rewards: [],
  }

  const expectedWithdrawStandbyTx = {
    __typename: 'EarnWithdraw',
    context: {
      id: 'id-earn/saga-Earn/Withdraw',
      tag: 'earn/saga',
      description: 'Earn/Withdraw',
    },
    networkId: NetworkId['arbitrum-sepolia'],
    inAmount: {
      value: '100',
      tokenId: mockArbUsdcTokenId,
    },
    outAmount: {
      value: '100',
      tokenId: networkConfig.aaveArbUsdcTokenId,
    },
    transactionHash: '0x1',
    type: TokenTransactionTypeV2.EarnWithdraw,
    feeCurrencyId: undefined,
    providerId: 'aave-v3',
  }

  // TODO: replace with EarnClaimReward type
  const expectedClaimRewardTx = {
    __typename: 'EarnClaimReward',
    context: {
      id: 'id-earn/saga-Earn/ClaimReward-1',
      tag: 'earn/saga',
      description: 'Earn/ClaimReward-1',
    },
    networkId: NetworkId['arbitrum-sepolia'],
    amount: {
      value: '1',
      tokenId: mockArbArbTokenId,
    },
    transactionHash: '0x2',
    type: TokenTransactionTypeV2.EarnClaimReward,
    feeCurrencyId: undefined,
    providerId: 'aave-v3',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sends withdraw and claim transactions, navigates home and dispatches the success action', async () => {
    await expectSaga(withdrawSubmitSaga, {
      type: withdrawStart.type,
      payload: {
        amount: '100',
        tokenId: mockArbUsdcTokenId,
        preparedTransactions: [serializableWithdrawTx, serializableClaimRewardTx],
        rewards: mockRewards,
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(withdrawSuccess())
      .put(fetchTokenBalances({ showLoading: false }))
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' })
      .run()

    expect(navigateHome).toHaveBeenCalled()
    expect(mockStandbyHandler).toHaveBeenCalledTimes(2)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, expectedWithdrawStandbyTx)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(2, expectedClaimRewardTx)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_start,
      expectedAnalyticsPropsWithRewards
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_success,
      expectedAnalyticsPropsWithRewards
    )
  })

  it('sends only withdraw if there are no rewards', async () => {
    await expectSaga(withdrawSubmitSaga, {
      type: withdrawStart.type,
      payload: {
        amount: '100',
        tokenId: mockArbUsdcTokenId,
        preparedTransactions: [serializableWithdrawTx],
        rewards: [],
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide(sagaProviders)
      .put(withdrawSuccess())
      .put(fetchTokenBalances({ showLoading: false }))
      .call.like({ fn: sendPreparedTransactions })
      .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
      .run()

    expect(navigateHome).toHaveBeenCalled()
    expect(mockStandbyHandler).toHaveBeenCalledTimes(1)
    expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, expectedWithdrawStandbyTx)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_start,
      expectedAnalyticsPropsNoRewards
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_success,
      expectedAnalyticsPropsNoRewards
    )
  })

  it('dispatches cancel action if pin input is cancelled and does not navigate home', async () => {
    await expectSaga(withdrawSubmitSaga, {
      type: withdrawStart.type,
      payload: {
        amount: '100',
        tokenId: mockArbUsdcTokenId,
        preparedTransactions: [serializableWithdrawTx],
        rewards: [],
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide([
        [matchers.call.fn(sendPreparedTransactions), throwError(CANCELLED_PIN_INPUT as any)],
        ...sagaProviders,
      ])
      .put(withdrawCancel())
      .not.put.actionType(fetchTokenBalances.type)
      .call.like({ fn: sendPreparedTransactions })
      .not.call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'])
      .run()
    expect(navigateHome).not.toHaveBeenCalled()
    expect(mockStandbyHandler).not.toHaveBeenCalled()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_start,
      expectedAnalyticsPropsNoRewards
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_cancel,
      expectedAnalyticsPropsNoRewards
    )
  })

  it('dispatches error action if transaction submission fails and does not navigate home', async () => {
    await expectSaga(withdrawSubmitSaga, {
      type: withdrawStart.type,
      payload: {
        amount: '100',
        tokenId: mockArbUsdcTokenId,
        preparedTransactions: [serializableWithdrawTx, serializableClaimRewardTx],
        rewards: mockRewards,
      },
    })
      .withState(createMockStore({ tokens: { tokenBalances: mockTokenBalances } }).getState())
      .provide([
        [matchers.call.fn(sendPreparedTransactions), throwError(new Error('Transaction failed'))],
        ...sagaProviders,
      ])
      .put(withdrawError())
      .not.put.actionType(fetchTokenBalances.type)
      .call.like({ fn: sendPreparedTransactions })
      .not.call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'])
      .run()
    expect(navigateHome).not.toHaveBeenCalled()
    expect(decodeFunctionData).not.toHaveBeenCalled()
    expect(mockStandbyHandler).not.toHaveBeenCalled()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_withdraw_submit_start,
      expectedAnalyticsPropsWithRewards
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_withdraw_submit_error, {
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
          amount: '100',
          tokenId: mockArbUsdcTokenId,
          preparedTransactions: [serializableWithdrawTx, serializableClaimRewardTx],
          rewards: mockRewards,
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
        .not.put.actionType(fetchTokenBalances.type)
        .call.like({ fn: sendPreparedTransactions })
        .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x1' })
        .call([publicClient[Network.Arbitrum], 'waitForTransactionReceipt'], { hash: '0x2' })
        .run()
      expect(navigateHome).toHaveBeenCalled()
      expect(mockStandbyHandler).toHaveBeenCalledTimes(2)
      expect(mockStandbyHandler).toHaveBeenNthCalledWith(1, expectedWithdrawStandbyTx)
      expect(mockStandbyHandler).toHaveBeenNthCalledWith(2, expectedClaimRewardTx)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        EarnEvents.earn_withdraw_submit_start,
        expectedAnalyticsPropsWithRewards
      )
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_withdraw_submit_error, {
        ...expectedAnalyticsPropsWithRewards,
        error: `Transaction ${num} reverted: ${hash}`,
      })
    }
  )
})

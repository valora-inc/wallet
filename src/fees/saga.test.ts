import { toTransactionObject } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import { showErrorOrFallback } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { estimateFee, feeEstimated, FeeEstimateState, FeeType } from 'src/fees/reducer'
import { calculateFee, estimateFeeSaga, SWAP_FEE_ESTIMATE_MULTIPLIER } from 'src/fees/saga'
import { buildSendTx } from 'src/send/saga'
import { NetworkId } from 'src/transactions/types'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { estimateGas } from 'src/web3/utils'
import { createMockStore } from 'test/utils'
import { mockCeurAddress, mockCeurTokenId, mockCusdAddress, mockCusdTokenId } from 'test/values'

const GAS_AMOUNT = 500000

jest.mock('@celo/connect')
jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

const mockTxo = jest.fn()

const store = createMockStore({
  tokens: {
    tokenBalances: {
      [mockCusdTokenId]: {
        address: mockCusdAddress,
        tokenId: mockCusdTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cUSD',
        priceUsd: '1',
        balance: '100',
        isFeeCurrency: true,
        priceFetchedAt: Date.now(),
      },
      [mockCeurTokenId]: {
        address: mockCeurAddress,
        tokenId: mockCeurTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cEUR',
        priceUsd: '1.2',
        balance: '0',
        isFeeCurrency: true,
        priceFetchedAt: Date.now(),
      },
    },
  },
})

describe(estimateFeeSaga, () => {
  beforeAll(() => {
    jest.useRealTimers()
    ;(toTransactionObject as jest.Mock).mockImplementation(() => mockTxo)
    Date.now = jest.fn(() => 1482363367071)
  })

  function estimation(usdFee: string): FeeEstimateState {
    return {
      loading: false,
      error: false,
      usdFee,
      lastUpdated: Date.now(),
      // @ts-ignore
      feeInfo: {
        fee: new BigNumber(usdFee).times(1e18),
        feeCurrency: mockCusdAddress,
      },
    }
  }

  it('estimates the send fee', async () => {
    await expectSaga(
      estimateFeeSaga,
      estimateFee({ feeType: FeeType.SEND, tokenAddress: mockCusdAddress })
    )
      .withState(store.getState())
      .provide([
        [matchers.call.fn(buildSendTx), jest.fn(() => ({ txo: mockTxo }))],
        [matchers.call.fn(estimateGas), new BigNumber(GAS_AMOUNT)],
        [
          call(calculateFee, new BigNumber(GAS_AMOUNT), mockCusdAddress),
          { fee: new BigNumber(1e16), feeCurrency: mockCusdAddress },
        ],
      ])
      .put(
        feeEstimated({
          feeType: FeeType.SEND,
          tokenAddress: mockCusdAddress,
          estimation: estimation(new BigNumber(0.01).toString()),
        })
      )
      .run()
  })

  it('estimates the swap fee', async () => {
    await expectSaga(
      estimateFeeSaga,
      estimateFee({ feeType: FeeType.SWAP, tokenAddress: mockCusdAddress })
    )
      .withState(store.getState())
      .provide([
        [matchers.call.fn(buildSendTx), jest.fn(() => ({ txo: mockTxo }))],
        [matchers.call.fn(estimateGas), new BigNumber(GAS_AMOUNT)],
        [
          call(
            calculateFee,
            new BigNumber(SWAP_FEE_ESTIMATE_MULTIPLIER * GAS_AMOUNT),
            mockCusdAddress
          ),
          { fee: new BigNumber(4e16), feeCurrency: mockCusdAddress },
        ],
      ])
      .put(
        feeEstimated({
          feeType: FeeType.SWAP,
          tokenAddress: mockCusdAddress,
          estimation: estimation(new BigNumber(0.04).toString()),
        })
      )
      .run()
  })

  it('estimates the dek register fee', async () => {
    const kit = await getContractKitAsync()
    const mockAccountsWrapper = { setAccount: jest.fn(() => ({ txo: mockTxo })) }
    await expectSaga(
      estimateFeeSaga,
      estimateFee({
        feeType: FeeType.REGISTER_DEK,
        tokenAddress: mockCusdAddress,
      })
    )
      .withState(store.getState())
      .provide([
        [call(getContractKit), kit],
        [call([kit.contracts, kit.contracts.getAccounts]), mockAccountsWrapper],
        [matchers.call.fn(estimateGas), new BigNumber(GAS_AMOUNT)],
        [
          call(calculateFee, new BigNumber(GAS_AMOUNT), mockCusdAddress),
          { fee: new BigNumber(1e16), feeCurrency: mockCusdAddress },
        ],
      ])
      .put(
        feeEstimated({
          feeType: FeeType.REGISTER_DEK,
          tokenAddress: mockCusdAddress,
          estimation: estimation(new BigNumber(0.01).toString()),
        })
      )
      .run()
  })

  it('marks as error if an error is thrown', async () => {
    await expectSaga(
      estimateFeeSaga,
      estimateFee({ feeType: FeeType.SEND, tokenAddress: mockCusdAddress })
    )
      .withState(store.getState())
      .provide([
        [matchers.call.fn(buildSendTx), jest.fn(() => ({ txo: mockTxo }))],
        [matchers.call.fn(estimateGas), new BigNumber(GAS_AMOUNT)],
        [
          call(calculateFee, new BigNumber(GAS_AMOUNT), mockCusdAddress),
          throwError(new Error('fake error')),
        ],
      ])
      .put(
        feeEstimated({
          feeType: FeeType.SEND,
          tokenAddress: mockCusdAddress,
          estimation: {
            loading: false,
            error: true,
            usdFee: null,
            lastUpdated: Date.now(),
          },
        })
      )
      .run()
  })

  it("marks as error if token info isn't found", async () => {
    await expectSaga(
      estimateFeeSaga,
      estimateFee({ feeType: FeeType.SEND, tokenAddress: 'randomAddress' })
    )
      .withState(store.getState())
      .provide([
        [matchers.call.fn(buildSendTx), jest.fn(() => ({ txo: mockTxo }))],
        [matchers.call.fn(estimateGas), new BigNumber(GAS_AMOUNT)],
        [
          call(calculateFee, new BigNumber(GAS_AMOUNT), mockCusdAddress),
          { fee: new BigNumber(1e16), feeCurrency: mockCusdAddress },
        ],
      ])
      .put(
        feeEstimated({
          feeType: FeeType.SEND,
          tokenAddress: 'randomAddress',
          estimation: {
            loading: false,
            error: true,
            usdFee: null,
            lastUpdated: Date.now(),
          },
        })
      )
      .run()
  })

  it('marks as error and shows banner if fee estimation fails', async () => {
    await expectSaga(
      estimateFeeSaga,
      estimateFee({ feeType: FeeType.SEND, tokenAddress: mockCusdAddress })
    )
      .withState(store.getState())
      .provide([
        [matchers.call.fn(buildSendTx), jest.fn(() => ({ txo: mockTxo }))],
        [matchers.call.fn(estimateGas), throwError(new Error('cannot estimate fee'))],
      ])
      .put(
        feeEstimated({
          feeType: FeeType.SEND,
          tokenAddress: mockCusdAddress,
          estimation: {
            loading: false,
            error: true,
            usdFee: null,
            lastUpdated: Date.now(),
          },
        })
      )
      .put(
        showErrorOrFallback(new Error('cannot estimate fee'), ErrorMessages.CALCULATE_FEE_FAILED)
      )
      .run()
  })

  it('marks as error without fee banner if token balance is zero', async () => {
    const { effects } = await expectSaga(
      estimateFeeSaga,
      estimateFee({ feeType: FeeType.SEND, tokenAddress: mockCeurAddress })
    )
      .withState(store.getState())
      .provide([
        [matchers.call.fn(buildSendTx), jest.fn(() => ({ txo: mockTxo }))],
        [matchers.call.fn(estimateGas), throwError(new Error('cannot estimate fee'))],
      ])
      .put(
        feeEstimated({
          feeType: FeeType.SEND,
          tokenAddress: mockCeurAddress,
          estimation: {
            loading: false,
            error: true,
            usdFee: null,
            lastUpdated: Date.now(),
          },
        })
      )
      .run()
    // ensures the above is the only put and put(showErrorOrFallback) isn't called
    expect(effects.put).toBeUndefined()
  })
})

import { toTransactionObject } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import { createReclaimTransaction } from 'src/escrow/saga'
import { feeEstimated, FeeEstimateState, FeeType } from 'src/fees/reducer'
import { calculateFee, estimateFeeSaga } from 'src/fees/saga'
import { buildSendTx } from 'src/send/saga'
import { getERC20TokenContract } from 'src/tokens/saga'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { estimateGas } from 'src/web3/utils'
import { createMockStore } from 'test/utils'
import { mockCeurAddress, mockContract, mockCusdAddress } from 'test/values'

const GAS_AMOUNT = 500000

jest.mock('@celo/connect')

const mockTxo = jest.fn()

const store = createMockStore({
  tokens: {
    tokenBalances: {
      [mockCusdAddress]: {
        address: mockCusdAddress,
        symbol: 'cUSD',
        usdPrice: '1',
        balance: '100',
        isCoreToken: true,
        priceFetchedAt: Date.now(),
      },
      [mockCeurAddress]: {
        address: mockCeurAddress,
        symbol: 'cEUR',
        usdPrice: '1.2',
        balance: '20',
        isCoreToken: true,
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

  it('estimates the invite fee', async () => {
    const contractKit = await getContractKitAsync()
    await expectSaga(estimateFeeSaga, {
      payload: { feeType: FeeType.INVITE, tokenAddress: mockCusdAddress },
    })
      .withState(store.getState())
      .provide([
        [call(getContractKit), contractKit],
        [call(getERC20TokenContract, mockCusdAddress), mockContract],
        [matchers.call.fn(estimateGas), new BigNumber(GAS_AMOUNT)],
        [
          call(calculateFee, new BigNumber(1050000), mockCusdAddress),
          { fee: new BigNumber(1e16), feeCurrency: mockCusdAddress },
        ],
      ])
      .put(
        feeEstimated({
          feeType: FeeType.INVITE,
          tokenAddress: mockCusdAddress,
          estimation: estimation(new BigNumber(0.01).toString()),
        })
      )
      .run()
  })

  it('estimates the send fee', async () => {
    await expectSaga(estimateFeeSaga, {
      payload: { feeType: FeeType.SEND, tokenAddress: mockCusdAddress },
    })
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

  it('estimates the escrow reclaim fee', async () => {
    await expectSaga(estimateFeeSaga, {
      payload: {
        feeType: FeeType.RECLAIM_ESCROW,
        tokenAddress: mockCusdAddress,
        paymentID: 'paymentID',
      },
    })
      .withState(store.getState())
      .provide([
        [call(createReclaimTransaction, 'paymentID'), mockTxo],
        [matchers.call.fn(estimateGas), new BigNumber(GAS_AMOUNT)],
        [
          call(calculateFee, new BigNumber(GAS_AMOUNT), mockCusdAddress),
          { fee: new BigNumber(1e16), feeCurrency: mockCusdAddress },
        ],
      ])
      .put(
        feeEstimated({
          feeType: FeeType.RECLAIM_ESCROW,
          tokenAddress: mockCusdAddress,
          estimation: estimation(new BigNumber(0.01).toString()),
        })
      )
      .run()
  })

  it('estimates the dek register fee', async () => {
    const kit = await getContractKitAsync()
    const mockAccountsWrapper = { setAccount: jest.fn(() => ({ txo: mockTxo })) }
    await expectSaga(estimateFeeSaga, {
      payload: { feeType: FeeType.REGISTER_DEK, tokenAddress: mockCusdAddress },
    })
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

  it('marks as error if no paymentID is sent for escrow reclaim fee', async () => {
    await expectSaga(estimateFeeSaga, {
      payload: { feeType: FeeType.RECLAIM_ESCROW, tokenAddress: mockCusdAddress },
    })
      .withState(store.getState())
      .provide([
        [call(createReclaimTransaction, 'paymentID'), mockTxo],
        [matchers.call.fn(estimateGas), new BigNumber(GAS_AMOUNT)],
        [
          call(calculateFee, new BigNumber(GAS_AMOUNT), mockCusdAddress),
          { fee: new BigNumber(1e16), feeCurrency: mockCusdAddress },
        ],
      ])
      .put(
        feeEstimated({
          feeType: FeeType.RECLAIM_ESCROW,
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

  it('marks as error if an error is thrown', async () => {
    await expectSaga(estimateFeeSaga, {
      payload: { feeType: FeeType.SEND, tokenAddress: mockCusdAddress },
    })
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
    await expectSaga(estimateFeeSaga, {
      payload: { feeType: FeeType.SEND, tokenAddress: 'randomAddress' },
    })
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
})

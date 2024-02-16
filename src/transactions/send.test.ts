import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  chooseTxFeeDetails,
  isTxPossiblyPending,
  shouldTxFailureRetry,
} from 'src/transactions/send'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import {
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
} from 'test/values'

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

const state = (override?: { celoBalance: string }) =>
  createMockStore({
    tokens: {
      tokenBalances: {
        [mockCusdTokenId]: {
          balance: '0',
          priceUsd: '1',
          symbol: 'cUSD',
          address: mockCusdAddress,
          tokenId: mockCusdTokenId,
          networkId: NetworkId['celo-alfajores'],
          isFeeCurrency: true,
          priceFetchedAt: Date.now(),
        },
        [mockCeurTokenId]: {
          balance: '1',
          priceUsd: '1.2',
          symbol: 'cEUR',
          address: mockCeurAddress,
          tokenId: mockCeurTokenId,
          networkId: NetworkId['celo-alfajores'],
          isFeeCurrency: true,
          priceFetchedAt: Date.now(),
        },
        [mockCeloTokenId]: {
          balance: override?.celoBalance ?? '0',
          priceUsd: '3.5',
          symbol: 'CELO',
          address: mockCeloAddress,
          tokenId: mockCeloTokenId,
          networkId: NetworkId['celo-alfajores'],
          isFeeCurrency: true,
          priceFetchedAt: Date.now(),
        },
      },
    },
  }).getState()

function* wrapperSaga({
  tx,
  feeCurrency,
  gas,
  gasPrice,
}: {
  tx: any
  feeCurrency: string | undefined
  gas?: number
  gasPrice?: BigNumber
}) {
  return (yield call(chooseTxFeeDetails, tx, feeCurrency, gas, gasPrice)) as {
    tx: any
    feeCurrency: string | undefined
    gas?: number
    gasPrice?: BigNumber
  }
}

describe('isTxPossiblyPending', () => {
  it('returns false when err is invalid', () => {
    const result = isTxPossiblyPending(null)
    expect(result).toBe(false)
  })
  it('returns true when timeout error', () => {
    const result = isTxPossiblyPending(new Error(ErrorMessages.TRANSACTION_TIMEOUT))
    expect(result).toBe(true)
  })
  it('returns true when known tx error', () => {
    const result = isTxPossiblyPending(new Error('known transaction error!!!'))
    expect(result).toBe(true)
  })
  it('returns true when nonce too low', () => {
    const result = isTxPossiblyPending(new Error('nonce too low error!!!'))
    expect(result).toBe(true)
  })
  it('returns true when failed to check for tx receipt', () => {
    const result = isTxPossiblyPending(new Error('Failed to check for transaction receipt:\n{}')) // error message copied from user's logs
    expect(result).toBe(true)
  })
  it('returns false when error is unrelated', () => {
    const result = isTxPossiblyPending(new Error('some unrelated error!!!'))
    expect(result).toBe(false)
  })
})

describe('shouldTxFailureRetry', () => {
  it('returns true when err is invalid', () => {
    const result = shouldTxFailureRetry(null)
    expect(result).toBe(true)
  })
  it('returns false when out of gas', () => {
    const result = shouldTxFailureRetry(new Error('out of gas error!'))
    expect(result).toBe(false)
  })
  it('returns false when tx is always failing', () => {
    const result = shouldTxFailureRetry(new Error('always failing transaction error!!!'))
    expect(result).toBe(false)
  })
  it('returns false when tx is possibly pending', () => {
    const result = shouldTxFailureRetry(new Error('nonce too low error!!!'))
    expect(result).toBe(false)
  })
  it('returns true when error is unrelated', () => {
    const result = shouldTxFailureRetry(new Error('some unrelated error!!!'))
    expect(result).toBe(true)
  })
})

describe('chooseTxFeeDetails', () => {
  it("returns the passed values if there's enough balance to pay for gas", async () => {
    await expectSaga(wrapperSaga, {
      tx: { from: '0xTEST', data: '0xABC' },
      feeCurrency: mockCeurAddress,
      gas: 100,
      gasPrice: new BigNumber(20),
    })
      .withState(state())
      .returns({
        feeCurrency: mockCeurAddress,
        gas: 100,
        gasPrice: new BigNumber(20),
      })
      .run()
  })

  it('returns a different fee currency if the passed one has no balance', async () => {
    await expectSaga(wrapperSaga, {
      tx: { from: '0xTEST', data: '0xABC' },
      feeCurrency: mockCusdAddress,
      gas: 100,
      gasPrice: new BigNumber(20),
    })
      .withState(state())
      .returns({
        feeCurrency: mockCeurAddress,
        gas: 100, // gas doesn't change since it went from a stable token to another
        gasPrice: undefined,
      })
      .run()
  })

  it('adds a padding to gas if switching from CELO fee currency to another', async () => {
    await expectSaga(wrapperSaga, {
      tx: { from: '0xTEST', data: '0xABC' },
      feeCurrency: undefined,
      gas: 100,
      gasPrice: new BigNumber(20),
    })
      .withState(state())
      .returns({
        feeCurrency: mockCeurAddress,
        gas: 50100, // 50000 is STATIC_GAS_PADDING
        gasPrice: undefined,
      })
      .run()
  })

  it("switches to another fee currency if there's some balance but not enough to cover the fee", async () => {
    await expectSaga(wrapperSaga, {
      tx: { from: '0xTEST', data: '0xABC' },
      feeCurrency: undefined,
      gas: 100,
      gasPrice: new BigNumber(20),
    })
      .withState(state({ celoBalance: new BigNumber(200).shiftedBy(-18).toString() }))
      .returns({
        feeCurrency: mockCeurAddress,
        gas: 50100, // 50000 is STATIC_GAS_PADDING
        gasPrice: undefined,
      })
      .run()
  })

  it('keeps the gas amount if going from stable token to CELO fee currency', async () => {
    await expectSaga(wrapperSaga, {
      tx: { from: '0xTEST', data: '0xABC' },
      feeCurrency: mockCusdAddress,
      gas: 100,
      gasPrice: new BigNumber(20),
    })
      .withState(state({ celoBalance: '20000' }))
      .returns({
        feeCurrency: undefined,
        gas: 100,
        gasPrice: undefined,
      })
      .run()
  })

  it('estimates gas and gas price if not passed', async () => {
    await expectSaga(wrapperSaga, {
      tx: { from: '0xTEST', data: '0xABC' },
      feeCurrency: mockCeurAddress,
    })
      .withState(state())
      .returns({
        feeCurrency: mockCeurAddress,
        gas: 1000000,
        gasPrice: new BigNumber(50000),
      })
      .run()
  })

  it('returns only estimated gas (with padding), not gasPrice if estimate is not enough for gas fee', async () => {
    await expectSaga(wrapperSaga, {
      tx: { from: '0xTEST', data: '0xABC' },
      feeCurrency: undefined,
    })
      .withState(state({ celoBalance: new BigNumber(200).shiftedBy(-18).toString() }))
      .returns({
        feeCurrency: mockCeurAddress,
        gas: 1050000, // Added STATIC_GAS_PADDING
        gasPrice: undefined,
      })
      .run()
  })
})

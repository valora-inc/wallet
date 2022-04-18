import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { chooseTxFeeDetails } from 'src/transactions/send'
import { createMockStore } from 'test/utils'
import { mockCeloAddress, mockCeurAddress, mockCusdAddress } from 'test/values'

const state = (override?: { celoBalance: string }) =>
  createMockStore({
    tokens: {
      tokenBalances: {
        [mockCusdAddress]: {
          balance: '0',
          usdPrice: '1',
          symbol: 'cUSD',
          address: mockCusdAddress,
          isCoreToken: true,
          priceFetchedAt: Date.now(),
        },
        [mockCeurAddress]: {
          balance: '1',
          usdPrice: '1.2',
          symbol: 'cEUR',
          address: mockCeurAddress,
          isCoreToken: true,
          priceFetchedAt: Date.now(),
        },
        [mockCeloAddress]: {
          balance: override?.celoBalance ?? '0',
          usdPrice: '3.5',
          symbol: 'CELO',
          address: mockCeloAddress,
          isCoreToken: true,
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
  return yield call(chooseTxFeeDetails, tx, feeCurrency, gas, gasPrice)
}

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
        gasPrice: '20',
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
        gasPrice: '50000',
      })
      .run()
  })

  it('returns only estimated gas (with padding), not gasPrice if estimate is not enough for gas cost', async () => {
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

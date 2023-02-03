import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { store } from 'src/redux/store'
import { swapSubmitSaga } from 'src/swap/saga'
import { swapApprove, swapError, swapExecute, swapPriceChange } from 'src/swap/slice'
import { sendTransaction } from 'src/transactions/send'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockAccount } from 'test/values'

const loggerErrorSpy = jest.spyOn(Logger, 'error')

const contractKit = {
  getWallet: jest.fn(),
  getAccounts: jest.fn(),
  connection: {
    chainId: jest.fn(() => '42220'),
    nonce: jest.fn(),
    gasPrice: jest.fn(),
  },
}

jest.mock('src/transactions/send', () => ({
  sendTransaction: jest.fn(() => ({ transactionHash: '0x123' })),
}))

const mockSwapTransaction = {
  buyAmount: '10000000000000000',
  buyTokenAddress: '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73',
  sellTokenAddress: '0xe8537a3d056da446677b9e9d6c5db704eaab4787',
  price: '1',
  guaranteedPrice: '1.02',
  from: '0x078e54ad49b0865fff9086fd084b92b3dac0857d',
  gas: '460533',
}

const mockSwap = {
  payload: {
    approveTransaction: {
      gas: '59480',
      from: mockAccount,
    },
    userInput: {
      updatedField: 'TO',
    },
    unvalidatedSwapTransaction: {
      ...mockSwapTransaction,
    },
  },
}

describe(swapSubmitSaga, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should complete swap', async () => {
    await expectSaga(swapSubmitSaga, mockSwap)
      .withState(store.getState())
      .provide([
        [select(walletAddressSelector), mockAccount],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
      ])
      .put(swapApprove())
      .put(swapExecute())
      .run()
    expect(sendTransaction).toHaveBeenCalledTimes(2)
    expect(loggerErrorSpy).not.toHaveBeenCalled()

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_execute_success, {
      toToken: '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73',
      fromToken: '0xe8537a3d056da446677b9e9d6c5db704eaab4787',
      amount: '10000000000000000',
      amountType: 'buyAmount',
      price: '1',
    })
  })

  it('should set swap state correctly on error', async () => {
    await expectSaga(swapSubmitSaga, mockSwap)
      .withState(store.getState())
      .provide([
        [select(walletAddressSelector), mockAccount],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), throwError(new Error('fake error'))],
      ])
      .put(swapApprove())
      .put(swapError())
      .run()
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_execute_error, {
      error: 'fake error',
    })
  })

  it('should set swap state correctly on price change', async () => {
    mockSwap.payload.unvalidatedSwapTransaction.guaranteedPrice = '1.021'
    await expectSaga(swapSubmitSaga, mockSwap)
      .withState(store.getState())
      .provide([
        [select(walletAddressSelector), mockAccount],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
      ])
      .put(swapPriceChange())
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_execute_price_change, {
      price: '1',
      guaranteedPrice: '1.021',
      toToken: '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73',
      fromToken: '0xe8537a3d056da446677b9e9d6c5db704eaab4787',
    })
  })
})

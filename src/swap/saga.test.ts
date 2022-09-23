import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import { swapSubmitSaga } from 'src/swap/saga'
import { swapApprove, swapError, swapExecute, swapPriceChange } from 'src/swap/slice'
import { sendTransaction } from 'src/transactions/send'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
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

const mockSwap = {
  payload: {
    approveTransaction: {
      gas: '59480',
    },
    userInput: {
      buyAmount: 'fakeInput',
    },
    unvalidatedSwapTransaction: {
      buyAmount: '10000000000000000',
      buyTokenAddress: '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73',
      sellTokenAddress: '0xe8537a3d056da446677b9e9d6c5db704eaab4787',
      price: '1',
      guaranteedPrice: '1.02',
    },
  },
}

describe(swapSubmitSaga, () => {
  const mockResponseAPI = {
    from: '0x078e54ad49b0865fff9086fd084b92b3dac0857d',
    gas: '460533',
  }

  const mockResponse = {
    ok: true,
    json: () => {
      return { validatedSwapTransaction: mockResponseAPI }
    },
  }

  const buyToken = '0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73'
  const sellToken = '0xe8537a3d056da446677b9e9d6c5db704eaab4787'
  const buyAmount = '10000000000000000'
  const executeSwapUri = `${networkConfig.executeSwapUrl}?buyToken=${buyToken}&sellToken=${sellToken}&buyAmount=${buyAmount}&userAddress=${mockAccount}`

  it('should complete swap', async () => {
    await expectSaga(swapSubmitSaga, mockSwap)
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(fetchWithTimeout, executeSwapUri), mockResponse],
      ])
      .put(swapApprove())
      .put(swapExecute())
      .run()
    expect(sendTransaction).toHaveBeenCalledTimes(2)
    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })

  it('should set swap state correctly on error', async () => {
    await expectSaga(swapSubmitSaga, mockSwap)
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(fetchWithTimeout, executeSwapUri), throwError(new Error('Error Fetching'))],
      ])
      .put(swapApprove())
      .put(swapError())
      .run()
  })

  it('should set swap state correctly when response ok is false', async () => {
    await expectSaga(swapSubmitSaga, mockSwap)
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(fetchWithTimeout, executeSwapUri), { ok: false }],
      ])
      .put(swapApprove())
      .put(swapError())
      .run()
  })

  it('should set swap state correctly on price change', async () => {
    mockSwap.payload.unvalidatedSwapTransaction.guaranteedPrice = '1.021'
    await expectSaga(swapSubmitSaga, mockSwap)
      .provide([
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [call(fetchWithTimeout, executeSwapUri), mockResponse],
      ])
      .put(swapPriceChange())
      .run()
  })
})

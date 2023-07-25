import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { store } from 'src/redux/store'
import { swapSubmitSaga } from 'src/swap/saga'
import { swapApprove, swapError, swapExecute, swapPriceChange } from 'src/swap/slice'
import { getERC20TokenContract } from 'src/tokens/saga'
import { swappableTokensSelector } from 'src/tokens/selectors'
import { sendTransaction } from 'src/transactions/send'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import {
  mockAccount,
  mockCeloAddress,
  mockCeurAddress,
  mockContract,
  mockTokenBalances,
} from 'test/values'
import { call, select } from 'typed-redux-saga'

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
  buyTokenAddress: mockCeloAddress,
  sellTokenAddress: mockCeurAddress,
  price: '1',
  guaranteedPrice: '1.02',
  from: '0x078e54ad49b0865fff9086fd084b92b3dac0857d',
  gas: '460533',
  allowanceTarget: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
  estimatedPriceImpact: '0.1',
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
    details: {
      swapProvider: '0x',
    },
  },
}

describe(swapSubmitSaga, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const defaultProviders: (EffectProviders | StaticProvider)[] = [
    [select(walletAddressSelector), mockAccount],
    [call(getContractKit), contractKit],
    [call(getConnectedUnlockedAccount), mockAccount],
    [
      select(swappableTokensSelector),
      [
        {
          ...mockTokenBalances[mockCeurAddress],
          balance: new BigNumber('10'),
        },
      ],
    ],
    [
      call(getERC20TokenContract, mockSwap.payload.unvalidatedSwapTransaction.sellTokenAddress),
      mockContract,
    ],
  ]

  it('should complete swap', async () => {
    await expectSaga(swapSubmitSaga, mockSwap)
      .withState(store.getState())
      .provide(defaultProviders)
      .put(swapApprove())
      .put(swapExecute())
      .run()
    expect(sendTransaction).toHaveBeenCalledTimes(2)
    expect(loggerErrorSpy).not.toHaveBeenCalled()

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_execute_success, {
      toToken: mockCeloAddress,
      fromToken: mockCeurAddress,
      amount: '10000000000000000',
      amountType: 'buyAmount',
      price: '1',
      allowanceTarget: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      estimatedPriceImpact: '0.1',
      provider: '0x',
      fromTokenBalance: '10000000000000000000',
      swapApproveTxId: 'a uuid',
      swapExecuteTxId: 'a uuid',
    })
  })

  it('should set swap state correctly on error', async () => {
    ;(sendTransaction as jest.Mock).mockImplementationOnce(() => {
      throw new Error('fake error')
    })
    await expectSaga(swapSubmitSaga, mockSwap)
      .withState(store.getState())
      .provide(defaultProviders)
      .put(swapApprove())
      .put(swapError())
      .run()
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_execute_error, {
      error: 'fake error',
      toToken: mockCeloAddress,
      fromToken: mockCeurAddress,
      amount: '10000000000000000',
      amountType: 'buyAmount',
      price: '1',
      allowanceTarget: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
      estimatedPriceImpact: '0.1',
      provider: '0x',
      fromTokenBalance: '10000000000000000000',
      swapApproveTxId: 'a uuid',
      swapExecuteTxId: 'a uuid',
    })
  })

  it('should set swap state correctly on price change', async () => {
    mockSwap.payload.unvalidatedSwapTransaction.guaranteedPrice = '1.021'
    await expectSaga(swapSubmitSaga, mockSwap)
      .withState(store.getState())
      .provide(defaultProviders)
      .put(swapPriceChange())
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_execute_price_change, {
      price: '1',
      guaranteedPrice: '1.021',
      toToken: mockCeloAddress,
      fromToken: mockCeurAddress,
    })
  })
})

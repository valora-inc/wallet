import { toTransactionObject } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { encryptComment } from 'src/identity/commentEncryption'
import { Actions, SendPaymentAction } from 'src/send/actions'
import { sendPaymentSaga } from 'src/send/saga'
import { getERC20TokenContract, getStableTokenContract } from 'src/tokens/saga'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { sendPayment as viemSendPayment } from 'src/viem/saga'
import {
  UnlockResult,
  getConnectedAccount,
  getConnectedUnlockedAccount,
  unlockAccount,
} from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockContract,
  mockCusdAddress,
  mockCusdTokenId,
  mockFeeInfo,
  mockQRCodeRecipient,
} from 'test/values'

jest.mock('@celo/connect')

const mockNewTransactionContext = jest.fn()

jest.mock('src/transactions/types', () => {
  const originalModule = jest.requireActual('src/transactions/types')

  return {
    ...originalModule,
    newTransactionContext: (tag: string, description: string) =>
      mockNewTransactionContext(tag, description),
  }
})

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    __esModule: true,
    ...originalModule,
    default: {
      ...originalModule.default,
      networkToNetworkId: {
        celo: 'celo-alfajores',
        ethereum: 'ethereuim-sepolia',
      },
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

const mockContext = { id: 'mock' }
mockNewTransactionContext.mockReturnValue(mockContext)

describe(sendPaymentSaga, () => {
  const amount = new BigNumber(10)
  const sendAction: SendPaymentAction = {
    type: Actions.SEND_PAYMENT,
    amount,
    tokenId: mockCusdTokenId,
    usdAmount: amount,
    comment: '',
    recipient: mockQRCodeRecipient,
    fromModal: false,
    feeInfo: mockFeeInfo,
  }

  const sendActionWithPreparedTx: SendPaymentAction = {
    ...sendAction,
    preparedTransaction: {
      from: '0xfrom',
      to: '0xto',
      data: '0xdata',
    },
  }

  beforeAll(() => {
    ;(toTransactionObject as jest.Mock).mockImplementation(() => jest.fn())
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sends a payment successfully with viem', async () => {
    await expectSaga(sendPaymentSaga, sendActionWithPreparedTx)
      .withState(createMockStore({}).getState())
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [matchers.call.fn(viemSendPayment), undefined],
      ])
      .call(viemSendPayment, {
        context: { id: 'mock' },
        recipientAddress: sendActionWithPreparedTx.recipient.address,
        amount: sendActionWithPreparedTx.amount,
        tokenId: sendActionWithPreparedTx.tokenId,
        comment: sendActionWithPreparedTx.comment,
        feeInfo: sendActionWithPreparedTx.feeInfo,
        preparedTransaction: sendActionWithPreparedTx.preparedTransaction,
      })
      .not.call.fn(sendAndMonitorTransaction)
      .run()

    expect(mockContract.methods.transferWithComment).not.toHaveBeenCalled()
    expect(mockContract.methods.transfer).not.toHaveBeenCalled()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('send_tx_complete', {
      txId: mockContext.id,
      recipientAddress: mockQRCodeRecipient.address,
      amount: '10',
      usdAmount: '10',
      tokenAddress: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'.toLowerCase(),
      tokenId: mockCusdTokenId,
      networkId: 'celo-alfajores',
      isTokenManuallyImported: false,
    })
  })

  it('fails if user cancels PIN input', async () => {
    const account = '0x000123'
    await expectSaga(sendPaymentSaga, sendAction)
      .provide([
        [call(getConnectedAccount), account],
        [matchers.call.fn(unlockAccount), UnlockResult.CANCELED],
      ])
      .put(showError(ErrorMessages.PIN_INPUT_CANCELED))
      .run()
  })

  it('uploads symmetric keys if transaction sent successfully', async () => {
    const account = '0x000123'
    await expectSaga(sendPaymentSaga, sendAction)
      .provide([
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(currentAccountSelector), account],
        [call(encryptComment, 'asdf', 'asdf', 'asdf', true), 'Asdf'],
        [call(getERC20TokenContract, mockCusdAddress), mockContract],
        [call(getStableTokenContract, mockCusdAddress), mockContract],
      ])
      .run()
  })
})

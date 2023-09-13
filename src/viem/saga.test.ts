import { CeloTransactionObject } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import erc20 from 'src/abis/IERC20'
import stableToken from 'src/abis/StableToken'
import { encryptComment } from 'src/identity/commentEncryption'
import { buildSendTx } from 'src/send/saga'
import { chooseTxFeeDetails } from 'src/transactions/send'
import { publicClient } from 'src/viem'
import { getSendTxFeeDetails, sendPayment } from 'src/viem/saga'
import { getViemWallet } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { UnlockResult, unlockAccount } from 'src/web3/saga'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockCeloAddress,
  mockCusdAddress,
  mockFeeInfo,
} from 'test/values'
import { getAddress } from 'viem'

const mockViemFeeInfo = {
  feeCurrency: getAddress(mockCusdAddress),
  gas: BigInt(mockFeeInfo.gas.toNumber()),
  maxFeePerGas: BigInt(mockFeeInfo.gasPrice.toNumber()),
}

describe('sendPayment', () => {
  const mockTxHash = '0x123456789'
  const mockViemWallet = {
    account: { address: mockAccount },
    writeContract: jest.fn(),
  }
  const simulateContractSpy = jest.spyOn(publicClient.celo, 'simulateContract')

  const mockSendPaymentArgs = {
    context: { id: 'txId' },
    recipientAddress: mockAccount2,
    amount: BigNumber(2),
    tokenAddress: mockCusdAddress,
    comment: 'comment',
    feeInfo: mockFeeInfo,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    simulateContractSpy.mockResolvedValue({ request: 'req' as any } as any)
    mockViemWallet.writeContract.mockResolvedValue(mockTxHash)
  })

  it('sends a payment successfully for stable token', async () => {
    await expectSaga(sendPayment, mockSendPaymentArgs)
      .withState(createMockStore().getState())
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(encryptComment), 'encryptedComment'],
        [matchers.call.fn(getSendTxFeeDetails), mockViemFeeInfo],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
      ])
      .call(getViemWallet, networkConfig.viemChain.celo)
      .call(encryptComment, 'comment', mockSendPaymentArgs.recipientAddress, mockAccount, true)
      .call(getSendTxFeeDetails, {
        recipientAddress: mockSendPaymentArgs.recipientAddress,
        amount: BigNumber(2),
        tokenAddress: mockCusdAddress,
        feeInfo: mockFeeInfo,
        encryptedComment: 'encryptedComment',
      })
      .returns(mockTxHash)
      .run()

    expect(simulateContractSpy).toHaveBeenCalledWith({
      address: getAddress(mockCusdAddress),
      abi: stableToken.abi,
      functionName: 'transferWithComment',
      account: mockViemWallet.account,
      args: [getAddress(mockSendPaymentArgs.recipientAddress), BigInt(2e18), 'encryptedComment'],
      ...mockViemFeeInfo,
    })
  })

  it('sends a payment successfully for non stable token', async () => {
    await expectSaga(sendPayment, { ...mockSendPaymentArgs, tokenAddress: mockCeloAddress })
      .withState(createMockStore().getState())
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(getSendTxFeeDetails), mockViemFeeInfo],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
      ])
      .call(getViemWallet, networkConfig.viemChain.celo)
      .not.call.fn(encryptComment)
      .call(getSendTxFeeDetails, {
        recipientAddress: mockSendPaymentArgs.recipientAddress,
        amount: BigNumber(2),
        tokenAddress: mockCeloAddress,
        feeInfo: mockFeeInfo,
        encryptedComment: '',
      })
      .returns(mockTxHash)
      .run()

    expect(simulateContractSpy).toHaveBeenCalledWith({
      address: getAddress(mockCeloAddress),
      abi: erc20.abi,
      functionName: 'transfer',
      account: mockViemWallet.account,
      args: [getAddress(mockSendPaymentArgs.recipientAddress), BigInt(2e18)],
      ...mockViemFeeInfo,
    })
  })

  it('throws if simulateContract fails', async () => {
    simulateContractSpy.mockRejectedValue(new Error('simulate error'))

    await expectSaga(sendPayment, { ...mockSendPaymentArgs, tokenAddress: mockCeloAddress })
      .withState(createMockStore().getState())
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(getSendTxFeeDetails), mockViemFeeInfo],
      ])
      .throws(new Error('simulate error'))
      .run()
  })

  it('throws if writeContract fails', async () => {
    mockViemWallet.writeContract.mockRejectedValue(new Error('write error'))

    await expectSaga(sendPayment, { ...mockSendPaymentArgs, tokenAddress: mockCeloAddress })
      .withState(createMockStore().getState())
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(getSendTxFeeDetails), mockViemFeeInfo],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
      ])
      .throws(new Error('write error'))
      .run()
  })
})

describe('getSendTxFeeDetails', () => {
  it('calls buildSendTx and chooseTxFeeDetails with the expected values', async () => {
    const recipientAddress = mockAccount
    const amount = new BigNumber(10)
    const tokenAddress = mockCusdAddress
    const feeInfo = mockFeeInfo
    const celoTx = {
      txo: 'test',
    } as unknown as CeloTransactionObject<unknown>
    const encryptedComment = 'test'

    const mockFeeDetails = {
      feeCurrency: mockCusdAddress,
      gas: feeInfo.gas,
      gasPrice: feeInfo.gasPrice,
    }

    await expectSaga(getSendTxFeeDetails, {
      recipientAddress,
      amount,
      tokenAddress,
      feeInfo,
      encryptedComment,
    })
      .withState(createMockStore().getState())
      .provide([
        [matchers.call.fn(buildSendTx), celoTx],
        [matchers.call.fn(chooseTxFeeDetails), mockFeeDetails],
      ])
      .call(buildSendTx, tokenAddress, amount, recipientAddress, encryptedComment)
      .call(
        chooseTxFeeDetails,
        celoTx.txo,
        feeInfo.feeCurrency,
        feeInfo.gas.toNumber(),
        feeInfo.gasPrice
      )
      .returns(mockViemFeeInfo)
      .run()
  })

  // TODO(ACT-925): remove this test once we've ensured gas and gasPrice are
  // consistently BigNumbers or strings
  it('returns fee if gas and gasPrice are strings', async () => {
    const recipientAddress = mockAccount
    const amount = new BigNumber(10)
    const tokenAddress = mockCusdAddress
    const feeInfo = {
      feeCurrency: mockCusdAddress,
      gas: mockFeeInfo.gas.toString(),
      gasPrice: mockFeeInfo.gasPrice.toString(),
    } as any
    const celoTx = {
      txo: 'test',
    } as unknown as CeloTransactionObject<unknown>
    const encryptedComment = 'test'

    const mockFeeDetails = {
      feeCurrency: mockCusdAddress,
      gas: feeInfo.gas,
      gasPrice: feeInfo.gasPrice,
    }

    await expectSaga(getSendTxFeeDetails, {
      recipientAddress,
      amount,
      tokenAddress,
      feeInfo,
      encryptedComment,
    })
      .withState(createMockStore().getState())
      .provide([
        [matchers.call.fn(buildSendTx), celoTx],
        [matchers.call.fn(chooseTxFeeDetails), mockFeeDetails],
      ])
      .call(buildSendTx, tokenAddress, amount, recipientAddress, encryptedComment)
      .call(
        chooseTxFeeDetails,
        celoTx.txo,
        feeInfo.feeCurrency,
        Number(feeInfo.gas),
        feeInfo.gasPrice
      )
      .returns(mockViemFeeInfo)
      .run()
  })
})

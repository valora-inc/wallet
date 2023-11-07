import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import erc20 from 'src/abis/IERC20'
import stableToken from 'src/abis/StableToken'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { encryptComment } from 'src/identity/commentEncryption'
import { fetchTokenBalances } from 'src/tokens/slice'
import {
  Actions,
  addHashToStandbyTransaction,
  removeStandbyTransaction,
  transactionConfirmed,
} from 'src/transactions/actions'
import { publicClient } from 'src/viem'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { sendAndMonitorTransaction, sendPayment } from 'src/viem/saga'
import { getViemWallet } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'

import { Network, NetworkId } from 'src/transactions/types'
import { UnlockResult, unlockAccount } from 'src/web3/saga'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockCeloAddress,
  mockCeloTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockEthTokenId,
  mockFeeInfo,
  mockUSDCAddress,
  mockUSDCTokenId,
} from 'test/values'
import { getAddress } from 'viem'

jest.mock('src/transactions/send', () => ({
  wrapSendTransactionWithRetry: jest
    .fn()
    .mockImplementation((sendTxMethod, _context) => sendTxMethod()),
}))

const mockViemFeeInfo = {
  feeCurrency: getAddress(mockCusdAddress),
  gas: BigInt(mockFeeInfo.gas.toNumber()),
  maxFeePerGas: BigInt(mockFeeInfo.gasPrice.toNumber()),
}

const mockViemWallet = {
  account: { address: mockAccount },
  writeContract: jest.fn(),
} as any as ViemWallet

describe('sendPayment', () => {
  const simulateContractCeloSpy = jest.spyOn(publicClient.celo, 'simulateContract')
  // We need to mock this outright for Ethereum, since for some reason, the viem simulation on Ethereum
  // complains that "transfer" does not exist on the contract, when it actually does
  const mockSimulateContractEthereum = jest
    .spyOn(publicClient.ethereum, 'simulateContract')
    // @ts-ignore
    .mockResolvedValue('some request')
  const callSpy = jest.spyOn(publicClient.ethereum, 'call')

  const mockSendPaymentArgs = {
    context: { id: 'txId' },
    recipientAddress: mockAccount2,
    amount: BigNumber(2),
    tokenId: mockCusdTokenId,
    comment: 'comment',
    feeInfo: mockFeeInfo,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    simulateContractCeloSpy.mockResolvedValue({ request: 'req' as any } as any)
  })

  it('sends a payment successfully for stable token', async () => {
    await expectSaga(sendPayment, mockSendPaymentArgs)
      .withState(createMockStore().getState())
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(encryptComment), 'encryptedComment'],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(sendAndMonitorTransaction), 'txReceipt'],
      ])
      .call(getViemWallet, networkConfig.viemChain.celo)
      .call(encryptComment, 'comment', mockSendPaymentArgs.recipientAddress, mockAccount, true)
      .put.like({ action: { type: Actions.ADD_STANDBY_TRANSACTION } })
      .returns('txReceipt')
      .run()

    expect(simulateContractCeloSpy).toHaveBeenCalledWith({
      address: getAddress(mockCusdAddress),
      abi: stableToken.abi,
      functionName: 'transferWithComment',
      account: mockViemWallet.account,
      args: [getAddress(mockSendPaymentArgs.recipientAddress), BigInt(2e18), 'encryptedComment'],
      ...mockViemFeeInfo,
    })
  })

  it('sends a payment successfully for non stable token', async () => {
    await expectSaga(sendPayment, { ...mockSendPaymentArgs, tokenId: mockCeloTokenId })
      .withState(createMockStore().getState())
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(sendAndMonitorTransaction), 'txReceipt'],
      ])
      .call(getViemWallet, networkConfig.viemChain.celo)
      .not.call.fn(encryptComment)
      .put.like({ action: { type: Actions.ADD_STANDBY_TRANSACTION } })
      .returns('txReceipt')
      .run()

    expect(simulateContractCeloSpy).toHaveBeenCalledWith({
      address: getAddress(mockCeloAddress),
      abi: erc20.abi,
      functionName: 'transfer',
      account: mockViemWallet.account,
      args: [getAddress(mockSendPaymentArgs.recipientAddress), BigInt(2e18)],
      ...mockViemFeeInfo,
    })
  })

  it('throws if simulateContract fails', async () => {
    simulateContractCeloSpy.mockRejectedValue(new Error('simulate error'))

    await expectSaga(sendPayment, { ...mockSendPaymentArgs, tokenId: mockCeloTokenId })
      .withState(createMockStore().getState())
      .provide([[matchers.call.fn(getViemWallet), mockViemWallet]])
      .not.put.like({ action: { type: Actions.ADD_STANDBY_TRANSACTION } })
      .not.call.fn(unlockAccount)
      .not.call.fn(sendAndMonitorTransaction)
      .throws(new Error('simulate error'))
      .run()
  })

  it('throws if sendAndMonitorTransaction fails', async () => {
    await expectSaga(sendPayment, { ...mockSendPaymentArgs, tokenId: mockCeloTokenId })
      .withState(createMockStore().getState())
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(sendAndMonitorTransaction), throwError(new Error('tx failed'))],
      ])
      .throws(new Error('tx failed'))
      .run()
  })

  it('sends a payment successfully for a non-Celo native asset', async () => {
    const mockSendEthPaymentArgs = {
      context: { id: 'txId' },
      recipientAddress: mockAccount2,
      amount: BigNumber(2),
      tokenId: mockEthTokenId,
      comment: '',
    }
    const mockEthTokenBalance = {
      name: 'Ethereum',
      networkId: NetworkId['ethereum-sepolia'],
      tokenId: mockEthTokenId,
      symbol: 'ETH',
      decimals: 18,
      imageUrl: '',
      balance: '10',
      priceUsd: '1',
      isCoreToken: true,
    }
    await expectSaga(sendPayment, mockSendEthPaymentArgs)
      .withState(
        createMockStore({
          tokens: {
            tokenBalances: {
              [mockEthTokenId]: mockEthTokenBalance,
            },
          },
        }).getState()
      )
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(sendAndMonitorTransaction), 'txReceipt'],
      ])
      .call(getViemWallet, networkConfig.viemChain.ethereum)
      .put.like({ action: { type: Actions.ADD_STANDBY_TRANSACTION } })
      .returns('txReceipt')
      .run()

    expect(callSpy).toHaveBeenCalledWith({
      account: mockViemWallet.account,
      to: getAddress(mockSendPaymentArgs.recipientAddress),
      value: BigInt(2e18),
    })
  })

  it('sends a payment successfully for a non-Celo ERC20', async () => {
    const mockSendUSDCPaymentArgs = {
      context: { id: 'txId' },
      recipientAddress: mockAccount2,
      amount: BigNumber(2),
      tokenId: mockUSDCTokenId,
      comment: '',
    }
    const mockUSDCTokenBalance = {
      name: 'USDC coin',
      networkId: NetworkId['ethereum-sepolia'],
      tokenId: mockUSDCTokenId,
      address: mockUSDCAddress,
      symbol: 'USDC',
      decimals: 18,
      imageUrl: '',
      balance: '10',
      priceUsd: '1',
    }
    await expectSaga(sendPayment, mockSendUSDCPaymentArgs)
      .withState(
        createMockStore({
          tokens: {
            tokenBalances: {
              [mockUSDCTokenId]: mockUSDCTokenBalance,
            },
          },
        }).getState()
      )
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(sendAndMonitorTransaction), 'txReceipt'],
      ])
      .not.call.fn(encryptComment)
      .call(getViemWallet, networkConfig.viemChain.ethereum)
      .put.like({ action: { type: Actions.ADD_STANDBY_TRANSACTION } })
      .returns('txReceipt')
      .run()

    expect(mockSimulateContractEthereum).toHaveBeenCalledWith({
      address: getAddress(mockUSDCAddress),
      abi: erc20.abi,
      functionName: 'transfer',
      account: mockViemWallet.account,
      args: [getAddress(mockSendPaymentArgs.recipientAddress), BigInt(2e18)],
      gas: undefined,
      maxFeePerGad: undefined,
    })
  })
})

describe('sendAndMonitorTransaction', () => {
  const mockTxHash: `0x${string}` = '0x12345678901234'
  const mockTxReceipt = { status: 'success', transactionHash: mockTxHash, blockNumber: 123 }

  const mockArgs = {
    context: { id: 'txId' },
    network: Network.Celo,
    sendTx: () => Promise.resolve(mockTxHash),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('confirms a transaction if successfully executed', async () => {
    await expectSaga(sendAndMonitorTransaction, mockArgs)
      .provide([[matchers.call.fn(publicClient.celo.waitForTransactionReceipt), mockTxReceipt]])
      .put(addHashToStandbyTransaction('txId', mockTxHash))
      .put(
        transactionConfirmed('txId', {
          transactionHash: mockTxHash,
          block: '123',
          status: true,
        })
      )
      .put(fetchTokenBalances({ showLoading: true }))
      .call([publicClient.celo, 'waitForTransactionReceipt'], { hash: mockTxHash })
      .returns(mockTxReceipt)
      .run()
  })

  it('fails a transaction and removes standby tx if receipt status is reverted', async () => {
    await expectSaga(sendAndMonitorTransaction, mockArgs)
      .provide([
        [
          matchers.call.fn(publicClient.celo.waitForTransactionReceipt),
          { status: 'reverted', blockNumber: BigInt(123) },
        ],
      ])
      .put(addHashToStandbyTransaction('txId', mockTxHash))
      .put(removeStandbyTransaction('txId'))
      .put(showError(ErrorMessages.TRANSACTION_FAILED))
      .call([publicClient.celo, 'waitForTransactionReceipt'], { hash: mockTxHash })
      .throws(new Error('transaction reverted'))
      .run()
  })

  it('fails a transaction and removes standby tx if writeContract throws', async () => {
    const sendTxFail = () => Promise.reject(new Error('write failed'))
    await expectSaga(sendAndMonitorTransaction, {
      ...mockArgs,
      sendTx: sendTxFail,
    })
      .provide([
        [matchers.call.fn(mockViemWallet.writeContract), throwError(new Error('write failed'))],
      ])
      .not.put(addHashToStandbyTransaction('txId', mockTxHash))
      .put(removeStandbyTransaction('txId'))
      .put(showError(ErrorMessages.TRANSACTION_FAILED))
      .not.call.fn(publicClient.celo.waitForTransactionReceipt)
      .throws(new Error('write failed'))
      .run()
  })

  it('fails a transaction and removes standby tx if wait for receipt throws', async () => {
    await expectSaga(sendAndMonitorTransaction, mockArgs)
      .provide([
        [
          matchers.call.fn(publicClient.celo.waitForTransactionReceipt),
          throwError(new Error('wait failed')),
        ],
      ])
      .put(addHashToStandbyTransaction('txId', mockTxHash))
      .put(removeStandbyTransaction('txId'))
      .put(showError(ErrorMessages.TRANSACTION_FAILED))
      .throws(new Error('wait failed'))
      .run()
  })
})

import { CeloTransactionObject } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import erc20 from 'src/abis/IERC20'
import stableToken from 'src/abis/StableToken'
import { encryptComment } from 'src/identity/commentEncryption'
import { buildSendTx } from 'src/send/saga'
import { fetchTokenBalances } from 'src/tokens/slice'
import { Actions, transactionConfirmed } from 'src/transactions/actions'
import { chooseTxFeeDetails } from 'src/transactions/send'
import { publicClient } from 'src/viem'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { getSendTxFeeDetails, sendAndMonitorTransaction, sendPayment } from 'src/viem/saga'
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
  chooseTxFeeDetails: jest.fn(),
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
        [matchers.call.fn(getSendTxFeeDetails), mockViemFeeInfo],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(sendAndMonitorTransaction), 'txReceipt'],
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
        [matchers.call.fn(getSendTxFeeDetails), mockViemFeeInfo],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(sendAndMonitorTransaction), 'txReceipt'],
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
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(getSendTxFeeDetails), mockViemFeeInfo],
      ])
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
        [matchers.call.fn(getSendTxFeeDetails), mockViemFeeInfo],
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

describe('getSendTxFeeDetails', () => {
  it('calls buildSendTx and chooseTxFeeDetails with the expected values and returns fee in viem format', async () => {
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

  it('does not include feeCurrency if it is undefined', async () => {
    const recipientAddress = mockAccount
    const amount = new BigNumber(10)
    const tokenAddress = mockCusdAddress
    const feeInfo = mockFeeInfo
    const celoTx = {
      txo: 'test',
    } as unknown as CeloTransactionObject<unknown>
    const encryptedComment = 'test'

    const mockFeeDetails = {
      feeCurrency: undefined,
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
      .call(chooseTxFeeDetails, celoTx.txo, undefined, feeInfo.gas.toNumber(), feeInfo.gasPrice)
      .returns({ gas: mockViemFeeInfo.gas, maxFeePerGas: mockViemFeeInfo.maxFeePerGas })
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

describe('sendAndMonitorTransaction', () => {
  const mockTxHash: `0x${string}` = '0x12345678901234'
  const mockTxReceipt = { status: 'success', transactionHash: mockTxHash, blockNumber: 123 }

  const mockArgs = {
    context: { id: 'txId' },
    network: Network.Celo,
    sendTx: function* () {
      return mockTxHash
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('confirms a transaction if successfully executed', async () => {
    await expectSaga(sendAndMonitorTransaction, mockArgs)
      .provide([[matchers.call.fn(publicClient.celo.waitForTransactionReceipt), mockTxReceipt]])
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
})

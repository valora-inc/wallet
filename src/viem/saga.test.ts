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
import { Actions, addStandbyTransaction, transactionConfirmed } from 'src/transactions/actions'
import { chooseTxFeeDetails } from 'src/transactions/send'
import { publicClient } from 'src/viem'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { getSendTxFeeDetails, sendAndMonitorTransaction, sendPayment } from 'src/viem/saga'
import { getViemWallet } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'

import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  Network,
  NetworkId,
  PendingStandbyTransfer,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
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
  mockTokenBalances,
  mockUSDCAddress,
  mockUSDCTokenId,
} from 'test/values'
import { Address, getAddress } from 'viem'

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
  account: { address: mockAccount2 },
  writeContract: jest.fn(),
  sendTransaction: jest.fn(),
} as any as ViemWallet

const storeStateWithTokens = createMockStore({
  tokens: {
    tokenBalances: mockTokenBalances,
  },
})

describe('sendPayment', () => {
  const mockTxHash: `0x${string}` = '0x12345678901234'
  const mockTxReceipt = {
    status: 'success',
    transactionHash: mockTxHash,
    blockNumber: 123,
    gasUsed: BigInt(1e6),
    effectiveGasPrice: BigInt(1e9),
  }

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

  const expectedStandbyTransaction: Omit<PendingStandbyTransfer, 'timestamp' | 'status'> = {
    __typename: 'TokenTransferV3',
    context: { id: 'txId' },
    type: TokenTransactionTypeV2.Sent,
    networkId: NetworkId['celo-alfajores'],
    amount: {
      value: BigNumber(2).negated().toString(),
      tokenAddress: mockCusdAddress,
      tokenId: mockCusdTokenId,
    },
    address: mockAccount2,
    metadata: {
      comment: 'comment',
    },
    feeCurrencyId: mockCeloTokenId,
  }

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
    isNative: true,
  }
  const mockEthPreparedTransaction: SerializableTransactionRequest = {
    type: 'eip1559',
    from: '0xfrom',
    to: '0xto',
    data: '0xdata',
    gas: '2000',
    maxFeePerGas: '1000000',
  }
  const mockCip42PreparedTransaction: SerializableTransactionRequest = {
    type: 'cip42',
    from: '0xfrom',
    to: '0xto',
    data: '0xdata',
    gas: '2000',
    maxFeePerGas: '1000000',
    feeCurrency: mockCusdAddress as Address,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    simulateContractCeloSpy.mockResolvedValue({ request: 'req' as any } as any)
  })

  it('sends a payment successfully for stable token', async () => {
    await expectSaga(sendPayment, mockSendPaymentArgs)
      .withState(storeStateWithTokens.getState())
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(encryptComment), 'encryptedComment'],
        [matchers.call.fn(getSendTxFeeDetails), mockViemFeeInfo],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(mockViemWallet.writeContract), mockTxHash],
        [matchers.call.fn(publicClient.celo.waitForTransactionReceipt), mockTxReceipt],
        [matchers.call.fn(publicClient.celo.getBlock), { timestamp: 1701102971 }],
      ])
      .call(getViemWallet, networkConfig.viemChain.celo)
      .call(encryptComment, 'comment', mockSendPaymentArgs.recipientAddress, mockAccount2, true)
      .call(getSendTxFeeDetails, {
        recipientAddress: mockSendPaymentArgs.recipientAddress,
        amount: BigNumber(2),
        tokenAddress: mockCusdAddress,
        feeInfo: mockFeeInfo,
        encryptedComment: 'encryptedComment',
      })
      .put(
        addStandbyTransaction({
          ...expectedStandbyTransaction,
          transactionHash: mockTxHash,
        })
      )
      .put(
        transactionConfirmed(
          'txId',
          {
            transactionHash: mockTxHash,
            block: '123',
            status: TransactionStatus.Complete,
            fees: [
              {
                type: 'SECURITY_FEE',
                amount: {
                  value: '0.001',
                  tokenId: mockCeloTokenId,
                },
              },
            ],
          },
          1701102971000
        )
      )
      .returns(mockTxReceipt)
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

  it('sends a payment successfully for stable token with prepared transaction', async () => {
    await expectSaga(sendPayment, {
      ...mockSendPaymentArgs,
      preparedTransaction: mockCip42PreparedTransaction,
    })
      .withState(createMockStore().getState())
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(encryptComment), 'encryptedComment'],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(mockViemWallet.writeContract), mockTxHash],
        [matchers.call.fn(publicClient.celo.waitForTransactionReceipt), mockTxReceipt],
        [matchers.call.fn(publicClient.celo.getBlock), { timestamp: 1701102971 }],
      ])
      .call(getViemWallet, networkConfig.viemChain.celo)
      .call(encryptComment, 'comment', mockSendPaymentArgs.recipientAddress, mockAccount2, true)
      .not.call.fn(getSendTxFeeDetails)
      .put(
        addStandbyTransaction({
          ...expectedStandbyTransaction,
          transactionHash: mockTxHash,
          feeCurrencyId: mockCusdTokenId,
        })
      )
      .returns(mockTxReceipt)
      .run()

    expect(simulateContractCeloSpy).toHaveBeenCalledWith({
      address: getAddress(mockCusdAddress),
      abi: stableToken.abi,
      functionName: 'transferWithComment',
      account: mockViemWallet.account,
      args: [getAddress(mockSendPaymentArgs.recipientAddress), BigInt(2e18), 'encryptedComment'],
      gas: BigInt(2000),
      maxFeePerGas: BigInt(1000000),
      feeCurrency: mockCusdAddress,
    })
  })

  it('sends a payment successfully for non stable token', async () => {
    await expectSaga(sendPayment, { ...mockSendPaymentArgs, tokenId: mockCeloTokenId })
      .withState(storeStateWithTokens.getState())
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(getSendTxFeeDetails), mockViemFeeInfo],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(mockViemWallet.writeContract), mockTxHash],
        [matchers.call.fn(publicClient.celo.waitForTransactionReceipt), mockTxReceipt],
        [matchers.call.fn(publicClient.celo.getBlock), { timestamp: 1701102971 }],
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
      .put(
        addStandbyTransaction({
          ...expectedStandbyTransaction,
          amount: {
            value: BigNumber(2).negated().toString(),
            tokenAddress: mockCeloAddress,
            tokenId: mockCeloTokenId,
          },
          transactionHash: mockTxHash,
        })
      )
      .put(
        transactionConfirmed(
          'txId',
          {
            transactionHash: mockTxHash,
            block: '123',
            status: TransactionStatus.Complete,
            fees: [
              {
                type: 'SECURITY_FEE',
                amount: {
                  value: '0.001',
                  tokenId: mockCeloTokenId,
                },
              },
            ],
          },
          1701102971000
        )
      )
      .returns(mockTxReceipt)
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

  it('sends a payment successfully for non stable token with prepared transaction', async () => {
    await expectSaga(sendPayment, {
      ...mockSendPaymentArgs,
      tokenId: mockCeloTokenId,
      preparedTransaction: mockCip42PreparedTransaction,
    })
      .withState(createMockStore().getState())
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(mockViemWallet.writeContract), mockTxHash],
        [matchers.call.fn(publicClient.celo.waitForTransactionReceipt), mockTxReceipt],
        [matchers.call.fn(publicClient.celo.getBlock), { timestamp: 1701102971 }],
      ])
      .call(getViemWallet, networkConfig.viemChain.celo)
      .not.call.fn(encryptComment)
      .not.call.fn(getSendTxFeeDetails)
      .put(
        addStandbyTransaction({
          ...expectedStandbyTransaction,
          amount: {
            value: BigNumber(2).negated().toString(),
            tokenAddress: mockCeloAddress,
            tokenId: mockCeloTokenId,
          },
          transactionHash: mockTxHash,
          feeCurrencyId: mockCusdTokenId,
        })
      )
      .put(
        transactionConfirmed(
          'txId',
          {
            transactionHash: mockTxHash,
            block: '123',
            status: TransactionStatus.Complete,
            fees: [
              {
                type: 'SECURITY_FEE',
                amount: {
                  value: '0.001',
                  tokenId: mockCusdTokenId,
                },
              },
            ],
          },
          1701102971000
        )
      )
      .returns(mockTxReceipt)
      .run()

    expect(simulateContractCeloSpy).toHaveBeenCalledWith({
      address: getAddress(mockCeloAddress),
      abi: erc20.abi,
      functionName: 'transfer',
      account: mockViemWallet.account,
      args: [getAddress(mockSendPaymentArgs.recipientAddress), BigInt(2e18)],
      gas: BigInt(2000),
      maxFeePerGas: BigInt(1000000),
      feeCurrency: mockCusdAddress,
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
      .not.put.like({ action: { type: Actions.ADD_STANDBY_TRANSACTION } })
      .throws(new Error('tx failed'))
      .run()
  })

  it('throws if writeContract fails', async () => {
    await expectSaga(sendPayment, { ...mockSendPaymentArgs, tokenId: mockCeloTokenId })
      .withState(createMockStore().getState())
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(getSendTxFeeDetails), mockViemFeeInfo],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(mockViemWallet.writeContract), throwError(new Error('tx failed'))],
      ])
      .not.put.like({ action: { type: Actions.ADD_STANDBY_TRANSACTION } })
      .not.call.fn(publicClient.celo.waitForTransactionReceipt)
      .throws(new Error('tx failed'))
      .run()
  })

  it('throws if sendTransaction fails', async () => {
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
        [matchers.call.fn(getSendTxFeeDetails), mockViemFeeInfo],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(mockViemWallet.sendTransaction), throwError(new Error('tx failed'))],
      ])
      .not.put.like({ action: { type: Actions.ADD_STANDBY_TRANSACTION } })
      .not.call.fn(publicClient.celo.waitForTransactionReceipt)
      .throws(new Error('tx failed'))
      .run()
  })

  it('sends a payment successfully for a non-Celo native asset', async () => {
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
        [matchers.call.fn(mockViemWallet.sendTransaction), mockTxHash],
        [matchers.call.fn(publicClient.ethereum.waitForTransactionReceipt), mockTxReceipt],
        [matchers.call.fn(publicClient.ethereum.getBlock), { timestamp: 1701102971 }],
      ])
      .call(getViemWallet, networkConfig.viemChain.ethereum)
      .put(
        addStandbyTransaction({
          ...expectedStandbyTransaction,
          networkId: NetworkId['ethereum-sepolia'],
          amount: {
            value: BigNumber(2).negated().toString(),
            tokenAddress: undefined,
            tokenId: mockEthTokenId,
          },
          metadata: {
            comment: '',
          },
          transactionHash: mockTxHash,
          feeCurrencyId: mockEthTokenId,
        })
      )
      .put(
        transactionConfirmed(
          'txId',
          {
            transactionHash: mockTxHash,
            block: '123',
            status: TransactionStatus.Complete,
            fees: [
              {
                type: 'SECURITY_FEE',
                amount: {
                  value: '0.001',
                  tokenId: mockEthTokenId,
                },
              },
            ],
          },
          1701102971000
        )
      )
      .returns(mockTxReceipt)
      .run()

    expect(callSpy).toHaveBeenCalledWith({
      account: mockViemWallet.account,
      to: getAddress(mockSendPaymentArgs.recipientAddress),
      value: BigInt(2e18),
    })
  })

  it('sends a payment successfully for a non-Celo native asset with prepared transaction', async () => {
    await expectSaga(sendPayment, {
      ...mockSendEthPaymentArgs,
      preparedTransaction: mockEthPreparedTransaction,
    })
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
        [matchers.call.fn(mockViemWallet.sendTransaction), mockTxHash],
        [matchers.call.fn(publicClient.ethereum.waitForTransactionReceipt), mockTxReceipt],
        [matchers.call.fn(publicClient.ethereum.getBlock), { timestamp: 1701102971 }],
      ])
      .call(getViemWallet, networkConfig.viemChain.ethereum)
      .put(
        addStandbyTransaction({
          ...expectedStandbyTransaction,
          networkId: NetworkId['ethereum-sepolia'],
          amount: {
            value: BigNumber(2).negated().toString(),
            tokenAddress: undefined,
            tokenId: mockEthTokenId,
          },
          metadata: {
            comment: '',
          },
          transactionHash: mockTxHash,
          feeCurrencyId: mockEthTokenId,
        })
      )
      .returns(mockTxReceipt)
      .run()

    expect(callSpy).toHaveBeenCalledWith({
      account: mockViemWallet.account,
      to: getAddress(mockSendPaymentArgs.recipientAddress),
      value: BigInt(2e18),
      gas: BigInt(2000),
      maxFeePerGas: BigInt(1000000),
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
    await expectSaga(sendPayment, mockSendUSDCPaymentArgs)
      .withState(storeStateWithTokens.getState())
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(mockViemWallet.writeContract), mockTxHash],
        [matchers.call.fn(publicClient.ethereum.waitForTransactionReceipt), mockTxReceipt],
        [matchers.call.fn(publicClient.ethereum.getBlock), { timestamp: 1701102971 }],
      ])
      .not.call.fn(encryptComment)
      .call(getViemWallet, networkConfig.viemChain.ethereum)
      .put(
        addStandbyTransaction({
          ...expectedStandbyTransaction,
          networkId: NetworkId['ethereum-sepolia'],
          amount: {
            value: BigNumber(2).negated().toString(),
            tokenAddress: mockUSDCAddress,
            tokenId: mockUSDCTokenId,
          },
          metadata: {
            comment: '',
          },
          transactionHash: mockTxHash,
          feeCurrencyId: mockEthTokenId,
        })
      )
      .put(
        transactionConfirmed(
          'txId',
          {
            transactionHash: mockTxHash,
            block: '123',
            status: TransactionStatus.Complete,
            fees: [
              {
                type: 'SECURITY_FEE',
                amount: {
                  value: '0.001',
                  tokenId: mockEthTokenId,
                },
              },
            ],
          },
          1701102971000
        )
      )
      .returns(mockTxReceipt)
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

  it('sends a payment successfully for a non-Celo ERC20 with prepared transaction', async () => {
    const mockSendUSDCPaymentArgs = {
      context: { id: 'txId' },
      recipientAddress: mockAccount2,
      amount: BigNumber(2),
      tokenId: mockUSDCTokenId,
      comment: '',
      preparedTransaction: mockEthPreparedTransaction,
    }
    await expectSaga(sendPayment, mockSendUSDCPaymentArgs)
      .withState(storeStateWithTokens.getState())
      .provide([
        [matchers.call.fn(getViemWallet), mockViemWallet],
        [matchers.call.fn(unlockAccount), UnlockResult.SUCCESS],
        [matchers.call.fn(mockViemWallet.writeContract), mockTxHash],
        [matchers.call.fn(publicClient.ethereum.waitForTransactionReceipt), mockTxReceipt],
        [matchers.call.fn(publicClient.ethereum.getBlock), { timestamp: 1701102971 }],
      ])
      .not.call.fn(encryptComment)
      .call(getViemWallet, networkConfig.viemChain.ethereum)
      .put(
        addStandbyTransaction({
          ...expectedStandbyTransaction,
          networkId: NetworkId['ethereum-sepolia'],
          amount: {
            value: BigNumber(2).negated().toString(),
            tokenAddress: mockUSDCAddress,
            tokenId: mockUSDCTokenId,
          },
          metadata: {
            comment: '',
          },
          transactionHash: mockTxHash,
          feeCurrencyId: mockEthTokenId,
        })
      )
      .returns(mockTxReceipt)
      .run()

    expect(mockSimulateContractEthereum).toHaveBeenCalledWith({
      address: getAddress(mockUSDCAddress),
      abi: erc20.abi,
      functionName: 'transfer',
      account: mockViemWallet.account,
      args: [getAddress(mockSendPaymentArgs.recipientAddress), BigInt(2e18)],
      gas: BigInt(2000),
      maxFeePerGas: BigInt(1000000),
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
  const mockTxReceipt = {
    status: 'success',
    transactionHash: mockTxHash,
    blockNumber: 123,
    gasUsed: 1e6,
    effectiveGasPrice: 1e9,
  }

  const mockArgs = {
    context: { id: 'txId' },
    network: Network.Celo,
    sendTx: function* () {
      return yield* mockTxHash
    },
    feeCurrencyId: mockCeloTokenId,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('confirms a transaction if successfully executed', async () => {
    await expectSaga(sendAndMonitorTransaction, mockArgs)
      .withState(storeStateWithTokens.getState())
      .provide([
        [matchers.call.fn(publicClient.celo.waitForTransactionReceipt), mockTxReceipt],
        [matchers.call.fn(publicClient.celo.getBlock), { timestamp: 1701102971 }],
      ])
      .put(
        transactionConfirmed(
          'txId',
          {
            transactionHash: mockTxHash,
            block: '123',
            status: TransactionStatus.Complete,
            fees: [
              {
                type: 'SECURITY_FEE',
                amount: {
                  value: '0.001',
                  tokenId: mockCeloTokenId,
                },
              },
            ],
          },
          1701102971000
        )
      )
      .put(fetchTokenBalances({ showLoading: true }))
      .returns(mockTxReceipt)
      .run()
  })

  it('throws and confirms a transaction as failed if receipt status is reverted', async () => {
    await expectSaga(sendAndMonitorTransaction, mockArgs)
      .withState(storeStateWithTokens.getState())
      .provide([
        [
          matchers.call.fn(publicClient.celo.waitForTransactionReceipt),
          {
            status: 'reverted',
            blockNumber: BigInt(123),
            transactionHash: mockTxHash,
            gasUsed: 1e4,
            effectiveGasPrice: 1e10,
          },
        ],
        [matchers.call.fn(publicClient.celo.getBlock), { timestamp: 1701102971 }],
      ])
      .put(
        transactionConfirmed(
          'txId',
          {
            transactionHash: mockTxHash,
            block: '123',
            status: TransactionStatus.Failed,
            fees: [
              {
                type: 'SECURITY_FEE',
                amount: {
                  value: '0.0001',
                  tokenId: mockCeloTokenId,
                },
              },
            ],
          },
          1701102971000
        )
      )
      .put(showError(ErrorMessages.TRANSACTION_FAILED))
      .throws(new Error('transaction reverted'))
      .run()
  })
})

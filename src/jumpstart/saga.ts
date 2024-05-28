import { PayloadAction } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import walletJumpstart from 'src/abis/IWalletJumpstart'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { jumpstartLinkHandler } from 'src/jumpstart/jumpstartLinkHandler'
import {
  JumpstarReclaimAction,
  JumpstartTransactionStartedAction,
  depositTransactionCancelled,
  depositTransactionFailed,
  depositTransactionStarted,
  depositTransactionSucceeded,
  jumpstartClaimFailed,
  jumpstartClaimStarted,
  jumpstartClaimSucceeded,
  jumpstartReclaimFailed,
  jumpstartReclaimStarted,
  jumpstartReclaimSucceeded,
} from 'src/jumpstart/slice'
import { getLocalCurrencyCode, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { NftMetadata } from 'src/nfts/types'
import { CANCELLED_PIN_INPUT } from 'src/pincode/authentication'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { vibrateError } from 'src/styles/hapticFeedback'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { getTokenId } from 'src/tokens/utils'
import { BaseStandbyTransaction, addStandbyTransaction } from 'src/transactions/actions'
import { NetworkId, TokenTransactionTypeV2, newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { safely } from 'src/utils/safely'
import { publicClient } from 'src/viem'
import { getPreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import { sendPreparedTransactions } from 'src/viem/saga'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { all, call, fork, put, select, spawn, takeEvery } from 'typed-redux-saga'
import { Address, Hash, TransactionReceipt, parseAbi, parseEventLogs } from 'viem'

const TAG = 'WalletJumpstart/saga'

export function* jumpstartClaim(privateKey: string, networkId: NetworkId, walletAddress: string) {
  try {
    yield* put(jumpstartClaimStarted())

    const contractAddress = getDynamicConfigParams(
      DynamicConfigs[StatsigDynamicConfigs.WALLET_JUMPSTART_CONFIG]
    ).jumpstartContracts?.[networkId]?.contractAddress

    if (!contractAddress) {
      throw new Error(`Contract address for ${networkId} is not provided in dynamic config`)
    }

    const transactionHashes = yield* call(
      jumpstartLinkHandler,
      networkId,
      contractAddress,
      privateKey,
      walletAddress
    )

    yield* fork(dispatchPendingTransactions, networkId, transactionHashes)

    ValoraAnalytics.track(JumpstartEvents.jumpstart_claim_succeeded)

    yield* put(jumpstartClaimSucceeded())
  } catch (error: any) {
    Logger.error(TAG, 'Error handling jumpstart link', error)
    ValoraAnalytics.track(JumpstartEvents.jumpstart_claim_failed)
    yield* put(
      jumpstartClaimFailed({ isAlreadyClaimed: error?.message?.includes('Already claimed') })
    )
  }
}

export function* dispatchPendingTransactions(networkId: NetworkId, transactionHashes: Hash[]) {
  try {
    const network = networkIdToNetwork[networkId]
    const transactionReceipts: TransactionReceipt[] = yield* all(
      transactionHashes.map((hash) =>
        call([publicClient[network], 'getTransactionReceipt'], { hash })
      )
    )

    yield* fork(dispatchPendingERC20Transactions, networkId, transactionReceipts)
    yield* fork(dispatchPendingERC721Transactions, networkId, transactionReceipts)
  } catch (error) {
    Logger.warn(TAG, 'Error dispatching pending transactions', error)
  }
}

export function* dispatchPendingERC20Transactions(
  networkId: NetworkId,
  transactionReceipts: TransactionReceipt[]
) {
  const tokensById = yield* select((state) => tokensByIdSelector(state, [networkId]))

  for (const { transactionHash, logs } of transactionReceipts) {
    const parsedLogs = parseEventLogs({
      abi: walletJumpstart.abi,
      eventName: ['ERC20Claimed'],
      logs,
    })

    for (const {
      address,
      args: { token: tokenAddress, amount },
    } of parsedLogs) {
      const tokenId = getTokenId(networkId, tokenAddress.toLowerCase())

      const token = tokensById[tokenId]
      if (!token) {
        Logger.warn(TAG, 'Claimed unknown tokenId', tokenId)
        continue
      }

      const value = new BigNumber(amount.toString()).shiftedBy(-token.decimals).toFixed()

      yield* put(
        addStandbyTransaction({
          __typename: 'TokenTransferV3',
          type: TokenTransactionTypeV2.Received,
          context: {
            id: transactionHash,
          },
          transactionHash,
          networkId,
          amount: {
            value,
            tokenAddress,
            tokenId,
          },
          address,
          metadata: {},
        })
      )

      ValoraAnalytics.track(JumpstartEvents.jumpstart_claimed_token, {
        networkId,
        tokenAddress,
        value: Number(value),
      })
    }
  }
}

export function* dispatchPendingERC721Transactions(
  networkId: NetworkId,
  transactionReceipts: TransactionReceipt[]
) {
  for (const { transactionHash, logs } of transactionReceipts) {
    const parsedLogs = parseEventLogs({
      abi: walletJumpstart.abi,
      eventName: ['ERC721Claimed'],
      logs,
    })

    for (const {
      args: { token: contractAddress, tokenId },
    } of parsedLogs) {
      try {
        const network = networkIdToNetwork[networkId]
        const tokenUri = (yield* call([publicClient[network], 'readContract'], {
          address: contractAddress,
          abi: parseAbi(['function tokenURI(uint256 tokenId) returns (string)']),
          functionName: 'tokenURI',
          args: [tokenId],
        })) as string

        const response = yield* call(fetchWithTimeout, tokenUri)
        const metadata = (yield* call([response, response.json])) as NftMetadata

        yield* put(
          addStandbyTransaction({
            __typename: 'NftTransferV3',
            type: TokenTransactionTypeV2.NftReceived,
            context: {
              id: transactionHash,
            },
            transactionHash,
            networkId,
            nfts: [
              {
                tokenId: tokenId.toString(),
                contractAddress: contractAddress.toLowerCase(),
                tokenUri,
                metadata,
                media: [
                  {
                    raw: metadata?.image,
                    gateway: metadata?.image,
                  },
                ],
              },
            ],
          })
        )

        ValoraAnalytics.track(JumpstartEvents.jumpstart_claimed_nft, {
          networkId,
          contractAddress,
          tokenId: tokenId.toString(),
        })
      } catch (error) {
        Logger.warn(TAG, 'Error adding pending NFT transaction', error)
      }
    }
  }
}

export function* sendJumpstartTransactions(
  action: PayloadAction<JumpstartTransactionStartedAction>
) {
  const { serializablePreparedTransactions, sendToken, sendAmount } = action.payload
  const networkId = sendToken.networkId
  const localCurrency = yield* select(getLocalCurrencyCode)
  const localCurrencyExchangeRate = yield* select(usdToLocalCurrencyRateSelector)

  const trackedProperties = {
    localCurrency,
    localCurrencyExchangeRate,
    tokenSymbol: sendToken.symbol,
    tokenAmount: sendAmount,
    amountInUsd: new BigNumber(sendAmount)
      .shiftedBy(-sendToken.decimals)
      .multipliedBy(sendToken.priceUsd ?? 0)
      .toFixed(2),
    tokenId: sendToken.tokenId,
    networkId: sendToken.networkId,
  }

  try {
    const jumpstartContractAddress = getDynamicConfigParams(
      DynamicConfigs[StatsigDynamicConfigs.WALLET_JUMPSTART_CONFIG]
    ).jumpstartContracts?.[networkId]?.contractAddress
    if (!jumpstartContractAddress) {
      throw new Error(
        `Jumpstart contract address for send token ${sendToken.tokenId} on network ${networkId} is not provided in dynamic config`
      )
    }

    const createStandbyTxHandlers = []
    const preparedTransactions = getPreparedTransactions(serializablePreparedTransactions)

    // in this flow, there should only be 1 or 2 transactions. if there are 2
    // transactions, the first one should be an approval.
    if (preparedTransactions.length > 2) {
      throw new Error(
        'Received more than the maximum expected number of transactions, only 2 is allowed'
      )
    }

    if (preparedTransactions.length === 2) {
      const createApprovalStandbyTx = (
        txHash: string,
        feeCurrencyId?: string
      ): BaseStandbyTransaction => {
        return {
          context: newTransactionContext(TAG, 'Approve jumpstart transaction'),
          __typename: 'TokenApproval',
          networkId,
          type: TokenTransactionTypeV2.Approval,
          transactionHash: txHash,
          tokenId: sendToken.tokenId,
          approvedAmount: sendAmount,
          feeCurrencyId,
        }
      }
      createStandbyTxHandlers.push(createApprovalStandbyTx)
    }

    const createStandbySendTransaction = (
      hash: string,
      feeCurrencyId?: string
    ): BaseStandbyTransaction => ({
      __typename: 'TokenTransferV3',
      type: TokenTransactionTypeV2.Sent,
      context: newTransactionContext(TAG, 'Send jumpstart transaction'),
      networkId,
      amount: {
        value: new BigNumber(sendAmount).negated().toString(),
        tokenAddress: sendToken.address ?? undefined,
        tokenId: sendToken.tokenId,
      },
      address: jumpstartContractAddress,
      metadata: {},
      transactionHash: hash,
      feeCurrencyId,
    })
    createStandbyTxHandlers.push(createStandbySendTransaction)

    Logger.debug(
      `${TAG}/sendJumpstartTransactionSaga`,
      'Executing send transaction',
      sendToken.tokenId
    )
    ValoraAnalytics.track(JumpstartEvents.jumpstart_send_start, trackedProperties)

    const txHashes = yield* call(
      sendPreparedTransactions,
      serializablePreparedTransactions,
      sendToken.networkId,
      createStandbyTxHandlers
    )

    Logger.debug(`${TAG}/sendJumpstartTransactionSaga`, 'Waiting for transaction receipts')
    const txReceipts = yield* all(
      txHashes.map((txHash) => {
        return call([publicClient[networkIdToNetwork[networkId]], 'waitForTransactionReceipt'], {
          hash: txHash,
        })
      })
    )
    txReceipts.forEach((receipt, index) => {
      Logger.debug(
        `${TAG}/sendJumpstartTransactionSaga`,
        `Received transaction receipt ${index + 1} of ${txReceipts.length}`,
        receipt
      )
    })

    const jumpstartTxReceipt = txReceipts[txReceipts.length - 1]
    if (jumpstartTxReceipt.status !== 'success') {
      throw new Error(`Jumpstart transaction reverted: ${jumpstartTxReceipt.transactionHash}`)
    }

    ValoraAnalytics.track(JumpstartEvents.jumpstart_send_succeeded, trackedProperties)
    yield* put(depositTransactionSucceeded())
  } catch (err) {
    if (err === CANCELLED_PIN_INPUT) {
      Logger.info(TAG, 'Transaction cancelled by user')
      ValoraAnalytics.track(JumpstartEvents.jumpstart_send_cancelled, trackedProperties)
      yield* put(depositTransactionCancelled())
      return
    }

    const error = ensureError(err)
    Logger.error(
      `${TAG}/sendJumpstartTransactionSaga`,
      'Error sending jumpstart transaction',
      error
    )

    ValoraAnalytics.track(JumpstartEvents.jumpstart_send_failed, trackedProperties)
    yield* put(depositTransactionFailed())
    vibrateError()
  }
}

export function* jumpstartReclaim(action: PayloadAction<JumpstarReclaimAction>) {
  const { reclaimTx, networkId, tokenAmount, depositTxHash } = action.payload
  try {
    const createStandbyReclaimTransaction = (
      transactionHash: string,
      _feeCurrencyId?: string
    ): BaseStandbyTransaction => {
      return {
        context: newTransactionContext(TAG, 'Reclaim transaction'),
        __typename: 'TokenTransferV3',
        networkId,
        type: TokenTransactionTypeV2.Received,
        transactionHash: transactionHash,
        amount: {
          value: new BigNumber(tokenAmount.value).negated().toString(),
          tokenId: tokenAmount.tokenId,
          tokenAddress: tokenAmount.tokenAddress,
        },
        address: reclaimTx.to as Address,
        metadata: {},
      }
    }

    Logger.debug(`${TAG}/jumpstartReclaim`, 'Executing reclaim transaction', reclaimTx)
    const [txHash] = yield* call(sendPreparedTransactions, [reclaimTx], networkId, [
      createStandbyReclaimTransaction,
    ])

    Logger.debug(`${TAG}/jumpstartReclaim`, 'Waiting for transaction receipt')
    const txReceipt = yield* call(
      [publicClient[networkIdToNetwork[networkId]], 'waitForTransactionReceipt'],
      {
        hash: txHash,
      }
    )
    Logger.debug(`${TAG}/jumpstartReclaim`, `Received transaction receipt`, txReceipt)

    if (txReceipt.status !== 'success') {
      throw new Error(`Jumpstart reclaim transaction reverted: ${txReceipt.transactionHash}`)
    }

    yield* put(jumpstartReclaimSucceeded())
    ValoraAnalytics.track(JumpstartEvents.jumpstart_reclaim_succeeded, {
      networkId,
      depositTxHash,
      reclaimTxHash: txHash,
    })
  } catch (err) {
    Logger.warn(TAG, 'Error reclaiming jumpstart transaction', err)
    ValoraAnalytics.track(JumpstartEvents.jumpstart_reclaim_failed, { networkId, depositTxHash })
    yield* put(jumpstartReclaimFailed())
  }
}

function* watchJumpstartTransaction() {
  yield* takeEvery(depositTransactionStarted.type, safely(sendJumpstartTransactions))
  yield* takeEvery(jumpstartReclaimStarted.type, safely(jumpstartReclaim))
}

export function* jumpstartSaga() {
  yield* spawn(watchJumpstartTransaction)
}

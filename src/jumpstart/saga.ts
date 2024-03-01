import BigNumber from 'bignumber.js'
import walletJumpstart from 'src/abis/IWalletJumpstart'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { jumpstartLinkHandler } from 'src/jumpstart/jumpstartLinkHandler'
import {
  jumpstartClaimFailed,
  jumpstartClaimStarted,
  jumpstartClaimSucceeded,
} from 'src/jumpstart/slice'
import { NftMetadata } from 'src/nfts/types'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { getTokenId } from 'src/tokens/utils'
import { addStandbyTransaction } from 'src/transactions/actions'
import { NetworkId, TokenTransactionTypeV2 } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { publicClient } from 'src/viem'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { all, call, fork, put, select } from 'typed-redux-saga'
import { Hash, TransactionReceipt, parseAbi, parseEventLogs } from 'viem'

const TAG = 'WalletJumpstart'

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
  } catch (error) {
    Logger.error(TAG, 'Error handling jumpstart link', error)
    ValoraAnalytics.track(JumpstartEvents.jumpstart_claim_failed)
    yield* put(jumpstartClaimFailed())
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
      const tokenId = getTokenId(networkId, tokenAddress)

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
                contractAddress,
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

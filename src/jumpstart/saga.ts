import BigNumber from 'bignumber.js'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  jumpstartClaimFailed,
  jumpstartClaimStarted,
  jumpstartClaimSucceeded,
} from 'src/home/actions'
import { jumpstartLinkHandler } from 'src/jumpstart/jumpstartLinkHandler'
import { NftMetadata } from 'src/nfts/types'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { getTokenId } from 'src/tokens/utils'
import { addStandbyTransaction } from 'src/transactions/actions'
import { TokenTransactionTypeV2 } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { publicClient } from 'src/viem'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { all, call, fork, put, select } from 'typed-redux-saga'
import { Hash, TransactionReceipt, parseAbi, parseEventLogs } from 'viem'

const TAG = 'WalletJumpstart'

export function* jumpstartClaim(privateKey: string) {
  const walletAddress = yield* select(walletAddressSelector)
  if (!walletAddress) {
    Logger.error(TAG, 'No wallet address found in store. This should never happen.')
    return
  }

  try {
    ValoraAnalytics.track(JumpstartEvents.jumpstart_started)
    yield* put(jumpstartClaimStarted())

    const transactionHashes = yield* call(jumpstartLinkHandler, privateKey, walletAddress)
    yield* fork(dispatchPendingTransactions, transactionHashes)

    ValoraAnalytics.track(JumpstartEvents.jumpstart_succeeded)
    yield* put(jumpstartClaimSucceeded())
  } catch (error) {
    Logger.error(TAG, 'Error handling jumpstart link', error)
    ValoraAnalytics.track(JumpstartEvents.jumpstart_failed)
    yield* put(jumpstartClaimFailed())
  }
}

export function* dispatchPendingTransactions(transactionHashes: Hash[]) {
  const networkId = networkConfig.defaultNetworkId
  const network = networkIdToNetwork[networkId]

  const tokensById = yield* select((state) => tokensByIdSelector(state, [networkId]))

  try {
    const transactionReceipts: TransactionReceipt[] = yield* all(
      transactionHashes.map((hash) =>
        call([publicClient[network], 'getTransactionReceipt'], { hash })
      )
    )

    for (const { transactionHash, logs } of transactionReceipts) {
      const parsedLogs = parseEventLogs({
        abi: parseAbi([
          'event ERC20Claimed(address indexed beneficiary, address sentTo, address indexed token, uint256 amount)',
          'event ERC721Claimed(address indexed beneficiary, address sentTo, address indexed token, uint256 tokenId)',
        ]),
        eventName: ['ERC20Claimed', 'ERC721Claimed'],
        logs,
      })

      for (const { eventName, address, args } of parsedLogs) {
        if (eventName === 'ERC20Claimed') {
          const tokenAddress = args.token
          const tokenId = getTokenId(networkId, tokenAddress)

          const token = tokensById[tokenId]
          if (!token) {
            continue
          }

          const value = new BigNumber(args.amount.toString()).shiftedBy(-token.decimals).toFixed()

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
        }

        if (eventName === 'ERC721Claimed') {
          const contractAddress = args.token
          const tokenId = args.tokenId

          try {
            const tokenUri = (yield* call([publicClient[network], 'readContract'], {
              address: contractAddress,
              abi: parseAbi(['function tokenURI(uint256 tokenId) returns (string memory)']),
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
          } catch (error) {
            Logger.error(TAG, 'Error adding jumpstart NFT pending transaction', error)
          }
        }
      }
    }
  } catch (error) {
    Logger.error(TAG, 'Error dispatching jumpstart pending transactions', error)
  }
}

import BigNumber from 'bignumber.js'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AppEvents } from 'src/analytics/Events'
import { DOLLAR_MIN_AMOUNT_ACCOUNT_FUNDED } from 'src/config'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import {
  importedTokensSelector,
  lastKnownTokenBalancesSelector,
  networksIconSelector,
  tokensByIdSelector,
} from 'src/tokens/selectors'
import {
  StoredTokenBalance,
  StoredTokenBalances,
  TokenBalance,
  fetchTokenBalancesFailure,
  setTokenBalances,
} from 'src/tokens/slice'
import { getSupportedNetworkIdsForTokenBalances } from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { publicClient } from 'src/viem'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, put, select, spawn, take } from 'typed-redux-saga'
import { Address, erc20Abi, getContract } from 'viem'

const TAG = 'tokens/saga'

export interface FetchedTokenBalance {
  tokenId: string
  tokenAddress?: string
  balance: string
}

export async function fetchTokenBalancesForAddress(
  address: string
): Promise<FetchedTokenBalance[]> {
  const networkIds = getSupportedNetworkIdsForTokenBalances()

  const url = new URL(networkConfig.getWalletBalancesUrl)
  url.searchParams.set('address', address)
  url.searchParams.set('networkIds', networkIds.join(','))

  const response = await fetchWithTimeout(url.toString())

  if (!response.ok) {
    throw new Error(`Failed to fetch token balances: ${response.status} ${response.statusText}`)
  }

  const userBalances = await response.json()
  return userBalances
}

export async function fetchTokenBalancesForAddressByTokenId(address: string) {
  const fetchedTokenBalances: FetchedTokenBalance[] = await fetchTokenBalancesForAddress(address)
  const fetchedBalancesByTokenId: Record<string, FetchedTokenBalance> = {}
  fetchedTokenBalances.forEach((token) => {
    fetchedBalancesByTokenId[token.tokenId] = token
  })
  return fetchedBalancesByTokenId
}

export async function getTokensInfo(): Promise<StoredTokenBalances> {
  const response = await fetchWithTimeout(networkConfig.getTokensInfoUrl)
  if (!response.ok) {
    Logger.error(TAG, `Failure response fetching token info: ${response}`)
    throw new Error(
      `Failure response fetching token info. ${response.status}  ${response.statusText}`
    )
  }
  return await response.json()
}

export function* fetchTokenBalancesSaga() {
  try {
    const address: string | null = yield* select(walletAddressSelector)
    if (!address) {
      Logger.debug(TAG, 'Skipping fetching tokens since no address was found')
      return
    }
    SentryTransactionHub.startTransaction(SentryTransaction.fetch_balances)

    const supportedNetworks = getSupportedNetworkIdsForTokenBalances()
    const importedTokens = yield* select(importedTokensSelector, supportedNetworks)
    const networkIconByNetworkId = yield* select(networksIconSelector)

    const supportedTokens = yield* call(getTokensInfo)
    const fetchedBalancesByTokenId = yield* call(fetchTokenBalancesForAddressByTokenId, address)

    for (const token of Object.values(supportedTokens) as StoredTokenBalance[]) {
      const tokenBalance = fetchedBalancesByTokenId[token.tokenId]
      if (!tokenBalance) {
        token.balance = '0'
      } else {
        token.balance = new BigNumber(tokenBalance.balance)
          .dividedBy(new BigNumber(10).pow(token.decimals))
          .toFixed()
      }
    }

    /* We are including the fetchedBalancesByTokenId since some balances might be already fetched
     * so we avoid fetching them again.
     * This could happen if the data source includes more tokens than we support (e.g. Blockscout).
     */
    const importedTokensWithBalance = yield* call(
      fetchImportedTokenBalances,
      address as Address,
      importedTokens,
      fetchedBalancesByTokenId
    )

    for (const tokenId of Object.keys(importedTokensWithBalance)) {
      const token = importedTokensWithBalance[tokenId]
      if (token) {
        token.networkIconUrl = networkIconByNetworkId[token.networkId]
      }
    }

    yield* put(
      setTokenBalances({
        ...importedTokensWithBalance,
        ...supportedTokens,
      })
    )
    SentryTransactionHub.finishTransaction(SentryTransaction.fetch_balances)
    AppAnalytics.track(AppEvents.fetch_balance, {})
  } catch (err) {
    const error = ensureError(err)
    yield* put(fetchTokenBalancesFailure())
    Logger.error(TAG, 'error fetching user balances', error.message)
    AppAnalytics.track(AppEvents.fetch_balance_error, {
      error: error.message,
    })
  }
}

export function tokenAmountInSmallestUnit(amount: BigNumber, decimals: number): string {
  const decimalFactor = new BigNumber(10).pow(decimals)
  return amount.multipliedBy(decimalFactor).toFixed(0)
}

export function* getTokenInfo(tokenId: string) {
  const networkIds = Object.values(networkConfig.networkToNetworkId)
  const tokens = yield* select((state) =>
    tokensByIdSelector(state, { networkIds, includePositionTokens: true })
  )
  return tokens[tokenId]
}

export function* watchAccountFundedOrLiquidated() {
  let prevTokenBalance
  let prevNetworkIds: Set<NetworkId> = new Set()
  while (true) {
    // we reset the usd value of all token balances to 0 if the exchange rate is
    // stale, so it is okay to use stale token prices to monitor the account
    // funded / liquidated status in this case
    const supportedNetworkIds = getSupportedNetworkIdsForTokenBalances()
    const supportedNetworkIdsSet = new Set(supportedNetworkIds)
    const tokenBalance: ReturnType<typeof lastKnownTokenBalancesSelector> = yield* select(
      lastKnownTokenBalancesSelector,
      supportedNetworkIds
    )

    if (tokenBalance !== null && tokenBalance !== prevTokenBalance) {
      // prevTokenBalance is undefined for the base case
      // tokenBalance is null when not yet loaded / refetching / failed to fetch
      if (prevTokenBalance) {
        const isAccountFundedBefore = prevTokenBalance?.gt(DOLLAR_MIN_AMOUNT_ACCOUNT_FUNDED)
        const isAccountFundedAfter = tokenBalance?.gt(DOLLAR_MIN_AMOUNT_ACCOUNT_FUNDED)

        if (
          isAccountFundedBefore &&
          !isAccountFundedAfter &&
          // check network ID consistency to avoid false positive for liquidated event
          // if supportedNetworkIds is missing a network ID that is in prevNetworkIds,
          // tokens from that network are missing from tokenBalance but may not have been liquidated
          [...prevNetworkIds].every((value) => supportedNetworkIdsSet.has(value))
        ) {
          AppAnalytics.track(AppEvents.account_liquidated)
        } else if (
          !isAccountFundedBefore &&
          isAccountFundedAfter &&
          // check network ID consistency to avoid false positive for liquidated event
          // if prevNetworkIds is missing a network ID that is in supportedNetworkIds,
          // tokens from that added network will now contribute to tokenBalance, even if there wasn't a funding event
          supportedNetworkIds.every((value) => prevNetworkIds.has(value))
        ) {
          AppAnalytics.track(AppEvents.account_funded)
        }
      }

      prevTokenBalance = tokenBalance
      prevNetworkIds = supportedNetworkIdsSet
    }

    yield* take()
  }
}

export async function fetchImportedTokenBalances(
  address: Address,
  importedTokens: TokenBalance[],
  knownTokenBalances: Record<string, FetchedTokenBalance>
) {
  const importedTokensWithBalance: StoredTokenBalances = {}

  const balanceRequests = importedTokens.map(async (importedToken) => {
    try {
      if (!importedToken) {
        return
      }

      let fetchedBalance
      if (knownTokenBalances[importedToken.tokenId]) {
        fetchedBalance = knownTokenBalances[importedToken.tokenId].balance
      } else {
        const contract = getContract({
          abi: erc20Abi,
          address: importedToken!.address as Address,
          client: {
            public: publicClient[networkIdToNetwork[importedToken.networkId]],
          },
        })
        fetchedBalance = (await contract.read.balanceOf([address])).toString()
      }

      const balance = new BigNumber(fetchedBalance).shiftedBy(-importedToken.decimals).toFixed()

      importedTokensWithBalance[importedToken.tokenId] = {
        ...importedToken,
        balance,
        priceUsd: undefined,
      }
    } catch (error) {
      Logger.error(
        TAG,
        `Error fetching imported token balance with address ${importedToken?.address}`,
        error
      )
    }
  })

  await Promise.all(balanceRequests)
  return importedTokensWithBalance
}

export function* tokensSaga() {
  yield* spawn(watchAccountFundedOrLiquidated)
}

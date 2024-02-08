import { StableToken } from '@celo/contractkit'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import BigNumber from 'bignumber.js'
import erc20 from 'src/abis/IERC20'
import * as stableToken from 'src/abis/StableToken.json'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { DOLLAR_MIN_AMOUNT_ACCOUNT_FUNDED } from 'src/config'
import { FeeInfo } from 'src/fees/saga'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import {
  importedTokensSelector,
  lastKnownTokenBalancesSelector,
  networksIconSelector,
  tokensListSelector,
  tokensListWithAddressSelector,
} from 'src/tokens/selectors'
import {
  StoredTokenBalance,
  StoredTokenBalances,
  TokenBalance,
  fetchTokenBalances,
  fetchTokenBalancesFailure,
  setTokenBalances,
} from 'src/tokens/slice'
import { getSupportedNetworkIdsForTokenBalances } from 'src/tokens/utils'
import { NetworkId, TransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { Currency } from 'src/utils/currencies'
import { ensureError } from 'src/utils/ensureError'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { gql } from 'src/utils/gql'
import { safely } from 'src/utils/safely'
import { publicClient } from 'src/viem'
import { WEI_PER_TOKEN } from 'src/web3/consts'
import { getContractKitAsync } from 'src/web3/contracts'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, put, select, spawn, take, takeEvery } from 'typed-redux-saga'
import { Address, getContract } from 'viem'

const TAG = 'tokens/saga'

// The number of wei that represent one unit in a contract
const contractWeiPerUnit: Record<Currency, BigNumber> = {
  [Currency.Celo]: WEI_PER_TOKEN,
  [Currency.Dollar]: WEI_PER_TOKEN,
  [Currency.Euro]: WEI_PER_TOKEN,
}

function* getWeiPerUnit(token: Currency) {
  let weiPerUnit = contractWeiPerUnit[token]
  if (!weiPerUnit) {
    const contract: GoldTokenWrapper | StableTokenWrapper = yield* call(getTokenContract, token)
    const decimals: number = yield* call(contract.decimals)
    weiPerUnit = new BigNumber(10).pow(decimals)
    contractWeiPerUnit[token] = weiPerUnit
  }
  return weiPerUnit
}

export function* convertFromContractDecimals(value: BigNumber, token: Currency) {
  const weiPerUnit: BigNumber = yield* call(getWeiPerUnit, token)
  return value.dividedBy(weiPerUnit)
}

export function* convertToContractDecimals(value: BigNumber, token: Currency) {
  const weiPerUnit: BigNumber = yield* call(getWeiPerUnit, token)
  return weiPerUnit.multipliedBy(value)
}

export async function getTokenContract(token: Currency) {
  Logger.debug(TAG + '@getTokenContract', `Fetching contract for ${token}`)
  const contractKit = await getContractKitAsync()
  switch (token) {
    case Currency.Celo:
      return contractKit.contracts.getGoldToken()
    case Currency.Dollar:
      return contractKit.contracts.getStableToken(StableToken.cUSD)
    case Currency.Euro:
      return contractKit.contracts.getStableToken(StableToken.cEUR)
    default:
      throw new Error(`Could not fetch contract for unknown token ${token}`)
  }
}

export async function getTokenContractFromAddress(tokenAddress: string) {
  Logger.debug(TAG + '@getTokenContract', `Fetching contract for address ${tokenAddress}`)
  const contractKit = await getContractKitAsync()
  const contracts = await Promise.all([
    contractKit.contracts.getGoldToken(),
    contractKit.contracts.getStableToken(StableToken.cUSD),
    contractKit.contracts.getStableToken(StableToken.cEUR),
  ])
  return contracts.find((contract) => contract.address.toLowerCase() === tokenAddress.toLowerCase())
}
export interface TokenTransfer {
  recipientAddress: string
  amount: string
  currency: Currency
  comment: string
  feeInfo?: FeeInfo
  context: TransactionContext
}

export type TokenTransferAction = { type: string } & TokenTransfer

export async function getERC20TokenContract(tokenAddress: string) {
  const kit = await getContractKitAsync()
  //@ts-ignore
  return new kit.web3.eth.Contract(erc20.abi, tokenAddress)
}

export async function getStableTokenContract(tokenAddress: string) {
  const kit = await getContractKitAsync()
  //@ts-ignore
  return new kit.web3.eth.Contract(stableToken.abi, tokenAddress)
}

export interface FetchedTokenBalance {
  tokenId: string
  tokenAddress?: string
  balance: string
}

interface UserBalancesResponse {
  userBalances: {
    balances: FetchedTokenBalance[]
  }
}

export async function fetchTokenBalancesForAddress(
  address: string
): Promise<FetchedTokenBalance[]> {
  const chainsToFetch = getSupportedNetworkIdsForTokenBalances()
  const userBalances = await Promise.all(
    chainsToFetch.map(async (networkId) => {
      const response = await fetch(`${networkConfig.blockchainApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query: gql`
            query FetchUserBalances($address: Address!, $networkId: NetworkId) {
              userBalances(address: $address, networkId: $networkId) {
                balances {
                  tokenId
                  tokenAddress
                  balance
                }
              }
            }
          `,
          variables: {
            address,
            networkId: networkId.replaceAll('-', '_'), // GraphQL does not support hyphens in enum values
          },
        }),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to fetch token balances for ${networkId}: ${response.status} ${response.statusText}`
        )
      }

      return (await response.json()) as { data: UserBalancesResponse }
    })
  )
  return userBalances.reduce(
    (acc, response) => acc.concat(response.data.userBalances.balances),
    [] as FetchedTokenBalance[]
  )
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
    const networkIconByNetworkId = yield* select(networksIconSelector, supportedNetworks)

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
    ValoraAnalytics.track(AppEvents.fetch_balance, {})
  } catch (err) {
    const error = ensureError(err)
    yield* put(fetchTokenBalancesFailure())
    Logger.error(TAG, 'error fetching user balances', error.message)
    ValoraAnalytics.track(AppEvents.fetch_balance_error, {
      error: error.message,
    })
  }
}

export function tokenAmountInSmallestUnit(amount: BigNumber, decimals: number): string {
  const decimalFactor = new BigNumber(10).pow(decimals)
  return amount.multipliedBy(decimalFactor).toFixed(0)
}

/**
 * @deprecated use getTokenInfo instead
 */
export function* getTokenInfoByAddress(tokenAddress: string) {
  const tokens: TokenBalance[] = yield* select(tokensListWithAddressSelector)
  const tokenInfo = tokens.find((token) => token.address === tokenAddress)
  return tokenInfo
}

export function* getTokenInfo(tokenId: string) {
  const networkIds = Object.values(networkConfig.networkToNetworkId)
  const tokens: TokenBalance[] = yield* select((state) => tokensListSelector(state, networkIds))
  const tokenInfo = tokens.find((token) => token.tokenId === tokenId)
  return tokenInfo
}

export function* watchFetchBalance() {
  yield* takeEvery([fetchTokenBalances.type], safely(fetchTokenBalancesSaga))
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
          ValoraAnalytics.track(AppEvents.account_liquidated)
        } else if (
          !isAccountFundedBefore &&
          isAccountFundedAfter &&
          // check network ID consistency to avoid false positive for liquidated event
          // if prevNetworkIds is missing a network ID that is in supportedNetworkIds,
          // tokens from that added network will now contribute to tokenBalance, even if there wasn't a funding event
          supportedNetworkIds.every((value) => prevNetworkIds.has(value))
        ) {
          ValoraAnalytics.track(AppEvents.account_funded)
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
          abi: erc20.abi,
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
  yield* spawn(watchFetchBalance)
  yield* spawn(watchAccountFundedOrLiquidated)
}

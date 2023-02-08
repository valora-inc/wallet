import { CeloTransactionObject, toTransactionObject } from '@celo/connect'
import { CeloContract, StableToken } from '@celo/contractkit'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { retryAsync } from '@celo/utils/lib/async'
import { gql } from 'apollo-boost'
import BigNumber from 'bignumber.js'
import { call, put, select, spawn, take, takeEvery } from 'redux-saga/effects'
import * as erc20 from 'src/abis/IERC20.json'
import * as stableToken from 'src/abis/StableToken.json'
import { showErrorOrFallback } from 'src/alert/actions'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { apolloClient } from 'src/apollo'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { DOLLAR_MIN_AMOUNT_ACCOUNT_FUNDED, WALLET_BALANCE_UPPER_BOUND } from 'src/config'
import { FeeInfo } from 'src/fees/saga'
import { WEI_PER_TOKEN } from 'src/geth/consts'
import { e2eTokens } from 'src/tokens/e2eTokens'
import {
  fetchTokenBalances,
  setTokenBalances,
  StoredTokenBalance,
  StoredTokenBalances,
  TokenBalance,
  tokenBalanceFetchError,
} from 'src/tokens/reducer'
import { tokensListSelector, totalTokenBalanceSelector } from 'src/tokens/selectors'
import { addStandbyTransactionLegacy, removeStandbyTransaction } from 'src/transactions/actions'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { TransactionContext, TransactionStatus } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { getContractKitAsync } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import * as utf8 from 'utf8'

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
    const contract: GoldTokenWrapper | StableTokenWrapper = yield call(getTokenContract, token)
    const decimals: number = yield call(contract.decimals)
    weiPerUnit = new BigNumber(10).pow(decimals)
    contractWeiPerUnit[token] = weiPerUnit
  }
  return weiPerUnit
}

export function* convertFromContractDecimals(value: BigNumber, token: Currency) {
  const weiPerUnit: BigNumber = yield call(getWeiPerUnit, token)
  return value.dividedBy(weiPerUnit)
}

export function* convertToContractDecimals(value: BigNumber, token: Currency) {
  const weiPerUnit: BigNumber = yield call(getWeiPerUnit, token)
  return weiPerUnit.multipliedBy(value)
}

export async function getTokenContract(token: Currency) {
  Logger.debug(TAG + '@getTokenContract', `Fetching contract for ${token}`)
  const contractKit = await getContractKitAsync(false)
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
  const contractKit = await getContractKitAsync(false)
  const contracts = await Promise.all([
    contractKit.contracts.getGoldToken(),
    contractKit.contracts.getStableToken(StableToken.cUSD),
    contractKit.contracts.getStableToken(StableToken.cEUR),
  ])
  return contracts.find((contract) => contract.address.toLowerCase() === tokenAddress.toLowerCase())
}

// TODO: To avoid making three requests each time this function is called, we should store the token
// addresses in the redux store. We will have to do this while working on multi-token support, so that
// is a good moment to clean this up.
export async function getStableCurrencyFromAddress(tokenAddress: string): Promise<Currency | null> {
  const contractKit = await getContractKitAsync(false)
  const [celoContract, cUsdContract, cEurContract] = await Promise.all([
    contractKit.contracts.getGoldToken(),
    contractKit.contracts.getStableToken(StableToken.cUSD),
    contractKit.contracts.getStableToken(StableToken.cEUR),
  ])
  if (celoContract.address === tokenAddress) {
    return Currency.Celo
  } else if (cUsdContract.address === tokenAddress) {
    return Currency.Dollar
  } else if (cEurContract.address === tokenAddress) {
    return Currency.Euro
  }
  return null
}

export function* fetchToken(token: Currency, tag: string) {
  try {
    Logger.debug(tag, `Fetching ${token} balance`)
    const account = yield call(getConnectedAccount)
    const tokenContract = yield call(getTokenContract, token)
    const balanceInWei: BigNumber = yield call([tokenContract, tokenContract.balanceOf], account)
    const balance: BigNumber = yield call(convertFromContractDecimals, balanceInWei, token)
    const balanceLogObject = { [`${token}Balance`]: balance.toString() }

    // Only update balances when it's less than the upper bound
    if (balance.lt(WALLET_BALANCE_UPPER_BOUND)) {
      ValoraAnalytics.track(AppEvents.fetch_balance, balanceLogObject)
      return balance.toString()
    } else {
      ValoraAnalytics.track(AppEvents.fetch_balance_error, balanceLogObject)
    }
  } catch (error: any) {
    Logger.error(tag, 'Error fetching balance', error)
  }
}

export interface BasicTokenTransfer {
  recipientAddress: string
  amount: BigNumber.Value
  comment: string
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

interface TokenTransferFactory {
  actionName: string
  tag: string
}

export async function createTokenTransferTransaction(
  tokenAddress: string,
  transferAction: BasicTokenTransfer
) {
  const { recipientAddress, amount, comment } = transferAction
  const contract = await getStableTokenContract(tokenAddress)

  const decimals = await contract.methods.decimals().call()
  const decimalBigNum = new BigNumber(decimals)
  const decimalFactor = new BigNumber(10).pow(decimalBigNum.toNumber())
  const convertedAmount = new BigNumber(amount).multipliedBy(decimalFactor).toFixed(0)

  const kit = await getContractKitAsync()
  return toTransactionObject(
    kit.connection,
    contract.methods.transferWithComment(
      recipientAddress,
      convertedAmount.toString(),
      utf8.encode(comment)
    )
  )
}

export async function fetchTokenBalanceInWeiWithRetry(token: Currency, account: string) {
  Logger.debug(TAG + '@fetchTokenBalanceInWeiWithRetry', 'Checking account balance', account)
  const tokenContract = await getTokenContract(token)
  // Retry needed here because it's typically the app's first tx and seems to fail on occasion
  // TODO consider having retry logic for ALL contract calls and txs. ContractKit should have this logic.
  const balanceInWei = await retryAsync(tokenContract.balanceOf, 3, [account])
  Logger.debug(
    TAG + '@fetchTokenBalanceInWeiWithRetry',
    `Account ${account} ${token} balance: ${balanceInWei.toString()}`
  )
  return balanceInWei
}

export function tokenTransferFactory({ actionName, tag }: TokenTransferFactory) {
  return function* () {
    while (true) {
      const transferAction: TokenTransferAction = yield take(actionName)
      const { recipientAddress, amount, currency, comment, feeInfo, context } = transferAction

      Logger.debug(
        tag,
        'Transferring token',
        context.description ?? 'No description',
        context.id,
        currency,
        amount,
        feeInfo ? JSON.stringify(feeInfo) : 'undefined'
      )

      yield put(
        addStandbyTransactionLegacy({
          context,
          type: TokenTransactionType.Sent,
          comment,
          status: TransactionStatus.Pending,
          value: amount.toString(),
          currency,
          timestamp: Math.floor(Date.now() / 1000),
          address: recipientAddress,
        })
      )

      try {
        const account: string = yield call(getConnectedUnlockedAccount)

        const currencyAddress: string = yield call(getCurrencyAddress, currency)
        const tx: CeloTransactionObject<boolean> = yield call(
          createTokenTransferTransaction,
          currencyAddress,
          {
            recipientAddress,
            amount,
            comment,
          }
        )

        yield call(
          sendAndMonitorTransaction,
          tx,
          account,
          context,
          feeInfo?.feeCurrency,
          feeInfo?.gas?.toNumber(),
          feeInfo?.gasPrice
        )
      } catch (error) {
        Logger.error(tag, 'Error transfering token', error)
        yield put(removeStandbyTransaction(context.id))
        yield put(showErrorOrFallback(error, ErrorMessages.TRANSACTION_FAILED))
      }
    }
  }
}

export async function getCurrencyAddress(currency: Currency) {
  const contractKit = await getContractKitAsync(false)
  switch (currency) {
    case Currency.Celo:
      return contractKit.registry.addressFor(CeloContract.GoldToken)
    case Currency.Dollar:
      return contractKit.registry.addressFor(CeloContract.StableToken)
    case Currency.Euro:
      return contractKit.registry.addressFor(CeloContract.StableTokenEUR)
  }
}

export async function getERC20TokenContract(tokenAddress: string) {
  const kit = await getContractKitAsync(false)
  //@ts-ignore
  return new kit.web3.eth.Contract(erc20.abi, tokenAddress)
}

export async function getStableTokenContract(tokenAddress: string) {
  const kit = await getContractKitAsync(false)
  //@ts-ignore
  return new kit.web3.eth.Contract(stableToken.abi, tokenAddress)
}

interface FetchedTokenBalance {
  tokenAddress: string
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
  const response = await apolloClient.query<UserBalancesResponse, { address: string }>({
    query: gql`
      query FetchUserBalances($address: Address!) {
        userBalances(address: $address) {
          balances {
            tokenAddress
            balance
          }
        }
      }
    `,
    variables: {
      address,
    },
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  })

  return response.data.userBalances.balances
}

export function* fetchTokenBalancesSaga() {
  try {
    const address: string | null = yield select(walletAddressSelector)
    if (!address) {
      Logger.debug(TAG, 'Skipping fetching tokens since no address was found')
      return
    }
    Logger.debug(TAG, 'Fetching token balances')
    // In e2e environment we use a static token list since we can't access Firebase.
    const tokens: StoredTokenBalances = e2eTokens() // isE2EEnv
    // ? e2eTokens()
    // : yield call(readOnceFromFirebase, 'tokensInfo')
    const tokenBalances: FetchedTokenBalance[] = yield call(fetchTokenBalancesForAddress, address)
    for (const token of Object.values(tokens) as StoredTokenBalance[]) {
      const tokenBalance = tokenBalances.find(
        (t) => t.tokenAddress.toLowerCase() === token.address.toLowerCase()
      )
      if (!tokenBalance) {
        token.balance = '0'
      } else {
        token.balance = new BigNumber(tokenBalance.balance)
          .dividedBy(new BigNumber(10).pow(token.decimals))
          .toString()
      }
    }
    yield put(setTokenBalances(tokens))
    ValoraAnalytics.track(AppEvents.fetch_balance, {})
  } catch (error) {
    yield put(tokenBalanceFetchError())
    Logger.error(TAG, 'error fetching user balances', error.message)
    ValoraAnalytics.track(AppEvents.fetch_balance_error, {
      error: error.message,
    })
  }
}

export function* tokenAmountInSmallestUnit(amount: BigNumber, tokenAddress: string) {
  const tokens: TokenBalance[] = yield select(tokensListSelector)
  const tokenInfo = tokens.find((token) => token.address === tokenAddress)
  if (!tokenInfo) {
    throw Error(`Couldnt find token info for address ${tokenAddress}.`)
  }

  const decimalFactor = new BigNumber(10).pow(tokenInfo.decimals)
  return amount.multipliedBy(decimalFactor).toFixed(0)
}

export function* getTokenInfo(tokenAddress: string) {
  const tokens: TokenBalance[] = yield select(tokensListSelector)
  const tokenInfo = tokens.find((token) => token.address === tokenAddress)
  return tokenInfo
}

export function* watchFetchBalance() {
  yield takeEvery(fetchTokenBalances.type, fetchTokenBalancesSaga)
}

export function* watchAccountFundedOrLiquidated() {
  let prevTokenBalance
  while (true) {
    const tokenBalance: ReturnType<typeof totalTokenBalanceSelector> = yield select(
      totalTokenBalanceSelector
    )
    if (tokenBalance !== prevTokenBalance) {
      // prevTokenBalance is undefined for the base case and null if token list
      // is not yet loaded
      if (prevTokenBalance) {
        const isAccountFundedBefore = prevTokenBalance?.gt(DOLLAR_MIN_AMOUNT_ACCOUNT_FUNDED)
        const isAccountFundedAfter = tokenBalance?.gt(DOLLAR_MIN_AMOUNT_ACCOUNT_FUNDED)

        if (isAccountFundedBefore && !isAccountFundedAfter) {
          ValoraAnalytics.track(AppEvents.account_liquidated)
        } else if (!isAccountFundedBefore && isAccountFundedAfter) {
          ValoraAnalytics.track(AppEvents.account_funded)
        }
      }

      prevTokenBalance = tokenBalance
    }

    yield take()
  }
}

export function* tokensSaga() {
  yield spawn(watchFetchBalance)
  yield spawn(watchAccountFundedOrLiquidated)
}

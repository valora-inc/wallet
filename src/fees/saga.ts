import { CeloTxObject } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { showErrorOrFallback } from 'src/alert/actions'
import { FeeEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { CELO_TRANSACTION_MIN_AMOUNT, STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { createReclaimTransaction } from 'src/escrow/saga'
import { FeeType, estimateFee, feeEstimated } from 'src/fees/reducer'
import { buildSendTx } from 'src/send/saga'
import {
  celoAddressSelector,
  coreTokensSelector,
  tokensByAddressSelector,
  tokensByUsdBalanceSelector,
} from 'src/tokens/selectors'
import { TokenBalanceWithAddress, TokenBalancesWithAddress } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { getContractKit } from 'src/web3/contracts'
import { getGasPrice } from 'src/web3/gas'
import { getWalletAddress } from 'src/web3/saga'
import { estimateGas } from 'src/web3/utils'
import { call, put, select, takeLatest } from 'typed-redux-saga'

const TAG = 'fees/saga'

export const SWAP_FEE_ESTIMATE_MULTIPLIER = 8
export const SWAP_CELO_FEE_ESTIMATE_MULTIPLIER = 3 * SWAP_FEE_ESTIMATE_MULTIPLIER

export interface FeeInfo {
  fee: BigNumber
  gas: BigNumber
  gasPrice: BigNumber
  feeCurrency: string | undefined
}

// Use default values for fee estimation
const PLACEHOLDER_ADDRESS = '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10'
const PLACEHOLDER_COMMENT = 'Coffee or Tea?'.repeat(5)
const PLACEHOLDER_AMOUNT = new BigNumber(0.00000001)
const PLACEHOLDER_DEK = '0x02c9cacca8c5c5ebb24dc6080a933f6d52a072136a069083438293d71da36049dc'

export function* estimateFeeSaga({
  payload: { tokenAddress, feeType, paymentID },
}: ReturnType<typeof estimateFee>) {
  Logger.debug(`${TAG}/estimateFeeSaga`, `updating for ${feeType} ${tokenAddress} `)

  const tokenBalances: TokenBalancesWithAddress = yield* select(tokensByAddressSelector)
  const tokenInfo = tokenBalances[tokenAddress]

  if (!tokenInfo?.balance || tokenInfo.balance.isEqualTo(0)) {
    Logger.warn(`${TAG}/estimateFeeSaga`, 'Balance is null or empty string or zero')
    yield* put(
      feeEstimated({
        feeType,
        tokenAddress,
        estimation: {
          usdFee: null,
          lastUpdated: Date.now(),
          error: true,
          loading: false,
        },
      })
    )
    return
  }

  Logger.debug(`${TAG}/estimateFeeSaga`, `balance is ${tokenInfo.balance}`)

  try {
    let feeInfo: FeeInfo | null = null

    switch (feeType) {
      case FeeType.SWAP:
        feeInfo = yield* call(estimateSwapFee, tokenAddress)
        break
      case FeeType.SEND:
        feeInfo = yield* call(estimateSendFee, tokenAddress)
        break
      case FeeType.EXCHANGE:
        // TODO
        break
      case FeeType.RECLAIM_ESCROW:
        feeInfo = yield* call(estimateReclaimEscrowFee, paymentID)
        break
      case FeeType.REGISTER_DEK:
        feeInfo = yield* call(estimateRegisterDekFee)
        break
    }

    if (feeInfo) {
      const usdFee = yield* call(mapFeeInfoToUsdFee, feeInfo)
      Logger.debug(`${TAG}/estimateFeeSaga`, `New fee is: ${usdFee.toString()}`)
      yield* put(
        feeEstimated({
          feeType,
          tokenAddress,
          estimation: {
            usdFee: usdFee.toString(),
            feeInfo,
            lastUpdated: Date.now(),
            error: false,
            loading: false,
          },
        })
      )
      AppAnalytics.track(FeeEvents.estimate_fee_success, {
        feeType,
        tokenAddress,
        usdFee: usdFee.toString(),
      })
    }
  } catch (err) {
    const error = ensureError(err)
    Logger.error(`${TAG}/estimateFeeSaga`, 'Error estimating fee', error)
    AppAnalytics.track(FeeEvents.estimate_fee_failed, {
      error: error.message,
      feeType,
      tokenAddress,
    })
    yield* put(showErrorOrFallback(error, ErrorMessages.CALCULATE_FEE_FAILED))
    yield* put(
      feeEstimated({
        feeType,
        tokenAddress,
        estimation: {
          usdFee: null,
          lastUpdated: Date.now(),
          error: true,
          loading: false,
        },
      })
    )
  }
}

export function* estimateSendFee(tokenAddress: string) {
  const tx = yield* call(
    buildSendTx,
    tokenAddress,
    PLACEHOLDER_AMOUNT,
    PLACEHOLDER_ADDRESS,
    PLACEHOLDER_COMMENT
  )

  const feeInfo = yield* call(calculateFeeForTx, tx.txo)
  return feeInfo
}

export function* estimateSwapFee(tokenAddress: string) {
  const tx = yield* call(
    buildSendTx,
    tokenAddress,
    PLACEHOLDER_AMOUNT,
    PLACEHOLDER_ADDRESS,
    PLACEHOLDER_COMMENT
  )

  // TODO: calculate the fee accurately.
  // To calculate the fee, you need the txo but in the in-app swaps flow the
  // swap amount is required to query the 0x API for the txo. For now,
  // approximate the fee to be 8x that of a simple transfer, to take into
  // account long swap routes.
  // Increased multiplier for CELO swaps because the ratio swap_fee / simple_transaction_fee is higher

  const celoAddress = yield* select(celoAddressSelector)
  const feeInfo = yield* call(
    calculateFeeForTx,
    tx.txo,
    tokenAddress === celoAddress ? SWAP_CELO_FEE_ESTIMATE_MULTIPLIER : SWAP_FEE_ESTIMATE_MULTIPLIER
  )
  return feeInfo
}

function* estimateReclaimEscrowFee(paymentID?: string) {
  if (!paymentID) {
    throw new Error('paymentID must be set for estimating escrow reclaim fee')
  }
  const txo = yield* call(createReclaimTransaction, paymentID)
  const feeInfo = yield* call(calculateFeeForTx, txo)
  return feeInfo
}

function* estimateRegisterDekFee() {
  const userAddress = yield* call(getWalletAddress)
  const kit = yield* call(getContractKit)
  const accounts = yield* call([kit.contracts, kit.contracts.getAccounts])
  const tx = accounts.setAccount('', PLACEHOLDER_DEK, userAddress)
  const feeInfo = yield* call(calculateFeeForTx, tx.txo)
  return feeInfo
}

function* calculateFeeForTx(txo: CeloTxObject<any>, gasMultiplier?: number) {
  const userAddress = yield* call(getWalletAddress)

  const feeCurrency = yield* call(fetchFeeCurrencySaga)
  const gasNeeded = yield* call(estimateGas, txo, {
    from: userAddress,
    feeCurrency,
  })

  const feeInfo = yield* call(calculateFee, gasNeeded.multipliedBy(gasMultiplier ?? 1), feeCurrency)
  return feeInfo
}

function* mapFeeInfoToUsdFee(feeInfo: FeeInfo) {
  const tokensInfo = yield* select(coreTokensSelector)
  const tokenInfo = tokensInfo.find(
    (token) =>
      token.address === feeInfo.feeCurrency || (token.symbol === 'CELO' && !feeInfo.feeCurrency)
  )
  if (!tokenInfo?.priceUsd) {
    throw new Error(`Missing tokenInfo or tokenInfo.priceUsd for ${feeInfo.feeCurrency}`)
  }
  return feeInfo.fee.times(tokenInfo.priceUsd).div(1e18)
}

export async function calculateFee(
  gas: BigNumber,
  feeCurrency: string | undefined
): Promise<FeeInfo> {
  const gasPrice = await getGasPrice(feeCurrency)
  const feeInWei = gas.multipliedBy(gasPrice)
  Logger.debug(`${TAG}/calculateFee`, `Calculated ${feeCurrency} fee is: ${feeInWei.toString()}`)
  return { gas, feeCurrency, gasPrice, fee: feeInWei }
}

export function* fetchFeeCurrencySaga() {
  const tokens = yield* select(tokensByUsdBalanceSelector)
  return fetchFeeCurrency(tokens)
}

export function fetchFeeCurrency(tokens: TokenBalanceWithAddress[]) {
  for (const token of tokens) {
    if (!token.isFeeCurrency) {
      continue
    }
    if (token.symbol === 'CELO' && token.balance.gte(CELO_TRANSACTION_MIN_AMOUNT)) {
      // Paying for fee with CELO requires passing undefined.
      return undefined
    } else if (token.balance.gte(STABLE_TRANSACTION_MIN_AMOUNT)) {
      return token.address
    }
  }
  Logger.warn(TAG, '@fetchFeeCurrency no currency has enough balance to pay for fee.')
  // This will cause a failure to calculate fee error dialog in the top.
  return undefined
}

export function* feesSaga() {
  yield* takeLatest(estimateFee.type, safely(estimateFeeSaga))
}

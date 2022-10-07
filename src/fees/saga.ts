import { CeloTransactionObject, CeloTxObject, Contract, toTransactionObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import BigNumber from 'bignumber.js'
import { call, put, select, takeLatest } from 'redux-saga/effects'
import { showErrorOrFallback } from 'src/alert/actions'
import { FeeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { CELO_TRANSACTION_MIN_AMOUNT, STABLE_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { createReclaimTransaction, STATIC_ESCROW_TRANSFER_GAS_ESTIMATE } from 'src/escrow/saga'
import { estimateFee, feeEstimated, FeeType } from 'src/fees/reducer'
import { buildSendTx } from 'src/send/saga'
import { TokenBalance, TokenBalances } from 'src/tokens/reducer'
import {
  getCurrencyAddress,
  getERC20TokenContract,
  tokenAmountInSmallestUnit,
} from 'src/tokens/saga'
import {
  coreTokensSelector,
  tokensByAddressSelector,
  tokensByUsdBalanceSelector,
} from 'src/tokens/selectors'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { getGasPrice } from 'src/web3/gas'
import { getWalletAddress } from 'src/web3/saga'
import { estimateGas } from 'src/web3/utils'

const TAG = 'fees/saga'

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

  const tokenBalances: TokenBalances = yield select(tokensByAddressSelector)
  const tokenInfo = tokenBalances[tokenAddress]

  if (!tokenInfo?.balance) {
    Logger.warn(`${TAG}/estimateFeeSaga`, 'Balance is null or empty string')
    yield put(
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
      case FeeType.INVITE:
        feeInfo = yield call(estimateInviteFee, tokenAddress)
        break
      case FeeType.SEND:
        feeInfo = yield call(estimateSendFee, tokenAddress)
        break
      case FeeType.EXCHANGE:
        // TODO
        break
      case FeeType.RECLAIM_ESCROW:
        feeInfo = yield call(estimateReclaimEscrowFee, paymentID)
        break
      case FeeType.REGISTER_DEK:
        feeInfo = yield call(estimateRegisterDekFee)
        break
    }

    if (feeInfo) {
      const usdFee: BigNumber = yield call(mapFeeInfoToUsdFee, feeInfo)
      Logger.debug(`${TAG}/estimateFeeSaga`, `New fee is: ${usdFee.toString()}`)
      yield put(
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
      ValoraAnalytics.track(FeeEvents.estimate_fee_success, {
        feeType,
        tokenAddress,
        usdFee: usdFee.toString(),
      })
    }
  } catch (error: any) {
    Logger.error(`${TAG}/estimateFeeSaga`, 'Error estimating fee', error)
    ValoraAnalytics.track(FeeEvents.estimate_fee_failed, {
      error: error.message,
      feeType,
      tokenAddress,
    })
    yield put(showErrorOrFallback(error, ErrorMessages.CALCULATE_FEE_FAILED))
    yield put(
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
  const tx: CeloTransactionObject<any> = yield call(
    buildSendTx,
    tokenAddress,
    PLACEHOLDER_AMOUNT,
    PLACEHOLDER_ADDRESS,
    PLACEHOLDER_COMMENT
  )

  const feeInfo: FeeInfo = yield call(calculateFeeForTx, tx.txo)
  return feeInfo
}

export function* estimateInviteFee(tokenAddress: string) {
  const kit: ContractKit = yield call(getContractKit)
  const tokenContract: Contract = yield call(getERC20TokenContract, tokenAddress)

  const amount: string = yield call(tokenAmountInSmallestUnit, PLACEHOLDER_AMOUNT, tokenAddress)
  const tx = toTransactionObject(
    kit.connection,
    tokenContract.methods.approve(PLACEHOLDER_ADDRESS, amount)
  )

  // We must add a static amount here for the transfer because we can't estimate it without sending the approve tx first.
  // If the approve tx hasn't gone through yet estimation fails because of a lack of allowance.
  const feeInfo: FeeInfo = yield call(
    calculateFeeForTx,
    tx.txo,
    new BigNumber(STATIC_ESCROW_TRANSFER_GAS_ESTIMATE)
  )
  return feeInfo
}

function* estimateReclaimEscrowFee(paymentID?: string) {
  if (!paymentID) {
    throw new Error('paymentID must be set for estimating escrow reclaim fee')
  }
  const txo: CeloTxObject<any> = yield call(createReclaimTransaction, paymentID)
  const feeInfo: FeeInfo = yield call(calculateFeeForTx, txo)
  return feeInfo
}

function* estimateRegisterDekFee() {
  const userAddress: string = yield call(getWalletAddress)
  const kit: ContractKit = yield call(getContractKit)
  const accounts: AccountsWrapper = yield call([kit.contracts, kit.contracts.getAccounts])
  const tx = accounts.setAccount('', PLACEHOLDER_DEK, userAddress)
  const feeInfo: FeeInfo = yield call(calculateFeeForTx, tx.txo)
  return feeInfo
}

function* calculateFeeForTx(txo: CeloTxObject<any>, extraGasNeeded?: BigNumber) {
  const userAddress: string = yield call(getWalletAddress)

  const feeCurrency: string | undefined = yield call(fetchFeeCurrencySaga)
  const gasNeeded: BigNumber = yield call(estimateGas, txo, {
    from: userAddress,
    feeCurrency,
  })

  const feeInfo: FeeInfo = yield call(
    calculateFee,
    gasNeeded.plus(extraGasNeeded ?? 0),
    feeCurrency
  )
  return feeInfo
}

function* mapFeeInfoToUsdFee(feeInfo: FeeInfo) {
  const tokensInfo: TokenBalance[] = yield select(coreTokensSelector)
  const tokenInfo = tokensInfo.find(
    (token) =>
      token.address === feeInfo.feeCurrency || (token.symbol === 'CELO' && !feeInfo.feeCurrency)
  )
  if (!tokenInfo?.usdPrice) {
    throw new Error(`Missing tokenInfo or tokenInfo.usdPrice for ${feeInfo.feeCurrency}`)
  }
  return feeInfo.fee.times(tokenInfo.usdPrice).div(1e18)
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

export async function currencyToFeeCurrency(currency: Currency): Promise<string | undefined> {
  if (currency === Currency.Celo) {
    return undefined
  }
  return getCurrencyAddress(currency)
}

export function* fetchFeeCurrencySaga() {
  const tokens: TokenBalance[] = yield select(tokensByUsdBalanceSelector)
  return fetchFeeCurrency(tokens)
}

export function fetchFeeCurrency(tokens: TokenBalance[]) {
  for (const token of tokens) {
    if (!token.isCoreToken) {
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
  yield takeLatest(estimateFee.type, estimateFeeSaga)
}

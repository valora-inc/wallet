import { CeloTransactionObject, CeloTxObject, Contract, toTransactionObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import BigNumber from 'bignumber.js'
import { call, put, select, takeLatest } from 'redux-saga/effects'
import { showErrorOrFallback } from 'src/alert/actions'
import { FeeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
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
  tokensByAddressSelector,
  tokensByCurrencySelector,
  tokensListSelector,
} from 'src/tokens/selectors'
import { CURRENCIES, Currency } from 'src/utils/currencies'
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
  currency: Currency
}

// Use default values for fee estimation
const PLACEHOLDER_ADDRESS = '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10'
const PLACEHOLDER_COMMENT = 'Coffee or Tea?'.repeat(5)
const PLACEHOLDER_AMOUNT = new BigNumber(1)
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
  } catch (error) {
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

  const feeCurrency: Currency = yield call(fetchFeeCurrencySaga)
  const feeCurrencyAddress: string = yield call(getCurrencyAddress, feeCurrency)
  const gasNeeded: BigNumber = yield call(estimateGas, txo, {
    from: userAddress,
    feeCurrency: feeCurrency === Currency.Celo ? undefined : feeCurrencyAddress,
  })

  const feeInfo: FeeInfo = yield call(
    calculateFee,
    gasNeeded.plus(extraGasNeeded ?? 0),
    feeCurrency
  )
  return feeInfo
}

function* mapFeeInfoToUsdFee(feeInfo: FeeInfo) {
  const tokensInfo: { [currency in Currency]: TokenBalance | undefined } = yield select(
    tokensByCurrencySelector
  )
  const tokenInfo = tokensInfo[feeInfo.currency]
  if (!tokenInfo) {
    throw new Error(`No token info found for ${feeInfo.currency}`)
  }
  return feeInfo.fee.times(tokenInfo.usdPrice).div(1e18)
}

export async function calculateFee(gas: BigNumber, currency: Currency): Promise<FeeInfo> {
  const gasPrice = await getGasPrice(currency)
  const feeInWei = gas.multipliedBy(gasPrice)
  Logger.debug(`${TAG}/calculateFee`, `Calculated ${currency} fee is: ${feeInWei.toString()}`)
  return { gas, currency, gasPrice, fee: feeInWei }
}

function* fetchFeeCurrencySaga() {
  const tokens: TokenBalance[] = yield select(tokensListSelector)
  return fetchFeeCurrency(tokens)
}

export function fetchFeeCurrency(tokens: TokenBalance[]) {
  for (const currency of Object.keys(CURRENCIES) as Currency[]) {
    const balance = tokens.find((token) => token.symbol === CURRENCIES[currency].cashTag)?.balance
    if (balance?.isGreaterThan(0)) {
      return currency
    }
  }
  Logger.error(TAG, '@fetchFeeCurrency no currency has enough balance to pay for fee.')
  return Currency.Dollar
}

export function* feesSaga() {
  yield takeLatest(estimateFee.type, estimateFeeSaga)
}

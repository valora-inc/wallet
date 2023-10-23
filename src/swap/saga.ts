import { CeloTransactionObject, CeloTx, Contract, toTransactionObject } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { PayloadAction } from '@reduxjs/toolkit'
import { SwapEvents } from 'src/analytics/Events'
import { SwapTimeMetrics } from 'src/analytics/Properties'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { maxSwapSlippagePercentageSelector } from 'src/app/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { vibrateError, vibrateSuccess } from 'src/styles/hapticFeedback'
import {
  swapApprove,
  swapError,
  swapExecute,
  swapPriceChange,
  swapStart,
  swapSuccess,
} from 'src/swap/slice'
import { Field, SwapInfo, SwapTransaction } from 'src/swap/types'
import { getERC20TokenContract } from 'src/tokens/saga'
import { swappableTokensSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { sendTransaction } from 'src/transactions/send'
import { TransactionContext, newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { applyChainIdWorkaround, buildTxo } from 'src/web3/utils'
import { call, put, select, takeLatest } from 'typed-redux-saga'

const TAG = 'swap/saga'

function getPercentageDifference(price1: number, price2: number) {
  return (Math.abs(price1 - price2) / ((price1 + price2) / 2)) * 100
}

function* handleSendSwapTransaction(
  rawTx: SwapTransaction,
  transactionContext: TransactionContext
) {
  const kit: ContractKit = yield* call(getContractKit)
  const walletAddress: string = yield* call(getConnectedUnlockedAccount)
  const normalizer = new TxParamsNormalizer(kit.connection)

  applyChainIdWorkaround(rawTx, yield* call([kit.connection, 'chainId']))
  const tx: CeloTx = yield* call(normalizer.populate.bind(normalizer), rawTx)
  const txo = buildTxo(kit, tx)

  yield* call(sendTransaction, txo, walletAddress, transactionContext)
}

function calculateEstimatedUsdValue({
  tokenInfo,
  tokenAmount,
}: {
  tokenInfo: TokenBalance
  tokenAmount: string
}): number | undefined {
  if (!tokenInfo.priceUsd) {
    return undefined
  }

  const amount = valueToBigNumber(tokenAmount)
  return tokenInfo.priceUsd.times(amount.shiftedBy(-tokenInfo.decimals)).toNumber()
}

export function* swapSubmitSaga(action: PayloadAction<SwapInfo>) {
  const swapSubmittedAt = Date.now()
  const {
    price,
    guaranteedPrice,
    buyTokenAddress,
    sellTokenAddress,
    buyAmount,
    sellAmount,
    allowanceTarget,
    estimatedPriceImpact,
  } = action.payload.unvalidatedSwapTransaction
  const amountType =
    action.payload.userInput.updatedField === Field.TO
      ? ('buyAmount' as const)
      : ('sellAmount' as const)
  const amount = action.payload.unvalidatedSwapTransaction[amountType]
  const { quoteReceivedAt } = action.payload

  const tokenBalances = yield* select(swappableTokensSelector)

  const fromToken = tokenBalances.find((token) => token.address === sellTokenAddress)
  const fromTokenBalance = fromToken
    ? fromToken.balance.shiftedBy(fromToken.decimals).toString()
    : ''
  const estimatedSellTokenUsdValue = fromToken
    ? calculateEstimatedUsdValue({ tokenInfo: fromToken, tokenAmount: sellAmount })
    : undefined

  const toToken = tokenBalances.find((token) => token.address === buyTokenAddress)
  const estimatedBuyTokenUsdValue = toToken
    ? calculateEstimatedUsdValue({ tokenInfo: toToken, tokenAmount: buyAmount })
    : undefined

  const swapApproveContext = newTransactionContext(TAG, 'Swap/Approve')
  const swapExecuteContext = newTransactionContext(TAG, 'Swap/Execute')

  const defaultSwapExecuteProps = {
    toToken: buyTokenAddress,
    fromToken: sellTokenAddress,
    amount,
    amountType,
    price,
    allowanceTarget,
    estimatedPriceImpact,
    provider: action.payload.details.swapProvider,
    fromTokenBalance,
    swapExecuteTxId: swapExecuteContext.id,
    swapApproveTxId: swapApproveContext.id,
    estimatedSellTokenUsdValue,
    estimatedBuyTokenUsdValue,
  }

  let quoteToTransactionElapsedTimeInMs: number | undefined

  const getTimeMetrics = (): SwapTimeMetrics => ({
    quoteToUserConfirmsSwapElapsedTimeInMs: swapSubmittedAt - quoteReceivedAt,
    quoteToTransactionElapsedTimeInMs,
  })

  try {
    // Navigate to swap pending screen
    navigate(Screens.SwapExecuteScreen)

    // Check that our guaranteedPrice is within 2%, maxSwapSlippagePercentage, of of the price
    const maxSlippagePercent: number = yield* select(maxSwapSlippagePercentageSelector)

    const priceDiff: number = yield* call(getPercentageDifference, +price, +guaranteedPrice)
    if (priceDiff >= maxSlippagePercent) {
      yield* put(swapPriceChange())
      ValoraAnalytics.track(SwapEvents.swap_execute_price_change, {
        price,
        guaranteedPrice,
        toToken: buyTokenAddress,
        fromToken: sellTokenAddress,
      })
      return
    }

    const walletAddress = yield* select(walletAddressSelector)

    const amountToApprove =
      amountType === 'buyAmount'
        ? valueToBigNumber(buyAmount).times(guaranteedPrice).toFixed(0, 0)
        : sellAmount

    // Approve transaction
    yield* put(swapApprove())
    Logger.debug(
      TAG,
      `Approving ${amountToApprove} of ${sellTokenAddress} for address: ${allowanceTarget}`
    )
    yield* call(
      sendApproveTx,
      sellTokenAddress,
      amountToApprove,
      allowanceTarget,
      swapApproveContext
    )

    // Execute transaction
    yield* put(swapExecute())
    Logger.debug(TAG, `Starting to swap execute for address: ${walletAddress}`)

    const beforeSwapExecutionTimestamp = Date.now()
    quoteToTransactionElapsedTimeInMs = beforeSwapExecutionTimestamp - quoteReceivedAt
    yield* call(
      handleSendSwapTransaction,
      { ...action.payload.unvalidatedSwapTransaction },
      swapExecuteContext
    )

    const timeMetrics = getTimeMetrics()

    yield* put(swapSuccess())
    vibrateSuccess()
    ValoraAnalytics.track(SwapEvents.swap_execute_success, {
      ...defaultSwapExecuteProps,
      ...timeMetrics,
    })
  } catch (err) {
    const error = ensureError(err)
    const timeMetrics = getTimeMetrics()

    Logger.error(TAG, 'Error while swapping', error)
    ValoraAnalytics.track(SwapEvents.swap_execute_error, {
      ...defaultSwapExecuteProps,
      ...timeMetrics,
      error: error.message,
    })
    yield* put(swapError())
    vibrateError()
  }
}

export function* swapSaga() {
  yield* takeLatest(swapStart.type, safely(swapSubmitSaga))
}

export function* sendApproveTx(
  tokenAddress: string,
  amount: string,
  recipientAddress: string,
  transactionContext: TransactionContext
) {
  const kit: ContractKit = yield* call(getContractKit)
  const contract: Contract = yield* call(getERC20TokenContract, tokenAddress)
  const walletAddress: string = yield* call(getConnectedUnlockedAccount)

  const tx: CeloTransactionObject<boolean> = toTransactionObject(
    kit.connection,
    contract.methods.approve(recipientAddress, amount)
  )

  yield* call(sendTransaction, tx.txo, walletAddress, transactionContext)
}

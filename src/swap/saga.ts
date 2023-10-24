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
  swapStartPrepared,
  swapSuccess,
} from 'src/swap/slice'
import { Field, SwapInfo, SwapInfoPrepared, SwapTransaction } from 'src/swap/types'
import { getERC20TokenContract } from 'src/tokens/saga'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { getTokenId } from 'src/tokens/utils'
import { addHashToStandbyTransaction, addStandbyTransaction } from 'src/transactions/actions'
import { sendTransaction } from 'src/transactions/send'
import {
  TokenTransactionTypeV2,
  TransactionContext,
  newTransactionContext,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { publicClient } from 'src/viem'
import { getContractKit, getViemWallet } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount, unlockAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { applyChainIdWorkaround, buildTxo } from 'src/web3/utils'
import { call, put, select, takeLatest } from 'typed-redux-saga'
import { Hash, zeroAddress } from 'viem'
import { getBlock, getTransactionCount } from 'viem/actions'

const TAG = 'swap/saga'

function getPercentageDifference(price1: number, price2: number) {
  return (Math.abs(price1 - price2) / ((price1 + price2) / 2)) * 100
}

function* handleSendSwapTransaction(
  rawTx: SwapTransaction,
  transactionContext: TransactionContext,
  fromToken: TokenBalance,
  toToken: TokenBalance
) {
  const kit: ContractKit = yield* call(getContractKit)
  const walletAddress: string = yield* call(getConnectedUnlockedAccount)
  const normalizer = new TxParamsNormalizer(kit.connection)

  applyChainIdWorkaround(rawTx, yield* call([kit.connection, 'chainId']))
  const tx: CeloTx = yield* call(normalizer.populate.bind(normalizer), rawTx)
  const txo = buildTxo(kit, tx)

  yield* put(
    addStandbyTransaction({
      context: transactionContext,
      __typename: 'TokenExchangeV3',
      networkId: networkConfig.defaultNetworkId,
      type: TokenTransactionTypeV2.SwapTransaction,
      inAmount: {
        value: valueToBigNumber(rawTx.sellAmount)
          .multipliedBy(rawTx.guaranteedPrice)
          .shiftedBy(-toToken.decimals),
        tokenId: toToken.tokenId,
      },
      outAmount: {
        value: valueToBigNumber(rawTx.sellAmount).shiftedBy(-fromToken.decimals),
        tokenId: fromToken.tokenId,
      },
    })
  )

  const receipt = yield* call(sendTransaction, txo, walletAddress, transactionContext)

  yield* put(addHashToStandbyTransaction(transactionContext.id, receipt.transactionHash))
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
  const { price, guaranteedPrice, buyAmount, sellAmount, allowanceTarget, estimatedPriceImpact } =
    action.payload.unvalidatedSwapTransaction
  const buyTokenAddress = action.payload.unvalidatedSwapTransaction.buyTokenAddress.toLowerCase()
  const sellTokenAddress = action.payload.unvalidatedSwapTransaction.sellTokenAddress.toLowerCase()
  const amountType =
    action.payload.userInput.updatedField === Field.TO
      ? ('buyAmount' as const)
      : ('sellAmount' as const)
  const amount = action.payload.unvalidatedSwapTransaction[amountType]
  const { quoteReceivedAt } = action.payload

  const tokens = yield* select((state) =>
    tokensByIdSelector(state, [networkConfig.defaultNetworkId])
  )
  const fromToken =
    tokens[getTokenId(networkConfig.defaultNetworkId, action.payload.userInput.fromToken)]
  const toToken =
    tokens[getTokenId(networkConfig.defaultNetworkId, action.payload.userInput.toToken)]

  if (!fromToken || !toToken) {
    Logger.error(
      TAG,
      `Could not find to or from token for swap from ${sellTokenAddress} to ${buyTokenAddress}`
    )
    yield* put(swapError())
    return
  }

  const fromTokenBalance = fromToken.balance.shiftedBy(fromToken.decimals).toString()
  const estimatedSellTokenUsdValue = calculateEstimatedUsdValue({
    tokenInfo: fromToken,
    tokenAmount: sellAmount,
  })
  const estimatedBuyTokenUsdValue = calculateEstimatedUsdValue({
    tokenInfo: toToken,
    tokenAmount: buyAmount,
  })

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

    // Approve transaction if the sell token is ERC-20
    if (allowanceTarget !== zeroAddress && fromToken.address) {
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
        fromToken.address,
        amountToApprove,
        allowanceTarget,
        swapApproveContext
      )
    }

    // Execute transaction
    yield* put(swapExecute())
    Logger.debug(TAG, `Starting to swap execute for address: ${walletAddress}`)

    const beforeSwapExecutionTimestamp = Date.now()
    quoteToTransactionElapsedTimeInMs = beforeSwapExecutionTimestamp - quoteReceivedAt
    yield* call(
      handleSendSwapTransaction,
      { ...action.payload.unvalidatedSwapTransaction },
      swapExecuteContext,
      fromToken,
      toToken
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

export function* swapSubmitPreparedSaga(action: PayloadAction<SwapInfoPrepared>) {
  const swapSubmittedAt = Date.now()
  const {
    price,
    buyTokenAddress,
    sellTokenAddress,
    buyAmount,
    sellAmount,
    allowanceTarget,
    estimatedPriceImpact,
    guaranteedPrice,
  } = action.payload.quote.rawSwapResponse.unvalidatedSwapTransaction
  const amountType =
    action.payload.userInput.updatedField === Field.TO
      ? ('buyAmount' as const)
      : ('sellAmount' as const)
  const amount = action.payload.quote.rawSwapResponse.unvalidatedSwapTransaction[amountType]
  const quoteReceivedAt = action.payload.quote.receivedAt

  const tokens = yield* select((state) =>
    tokensByIdSelector(state, [networkConfig.defaultNetworkId])
  )
  const fromToken =
    tokens[getTokenId(networkConfig.defaultNetworkId, action.payload.userInput.fromToken)]
  const toToken =
    tokens[getTokenId(networkConfig.defaultNetworkId, action.payload.userInput.toToken)]

  if (!fromToken || !toToken) {
    Logger.error(
      TAG,
      `Could not find to or from token for swap from ${sellTokenAddress} to ${buyTokenAddress}`
    )
    yield* put(swapError())
    return
  }

  const fromTokenBalance = fromToken.balance.shiftedBy(fromToken.decimals).toString()
  const estimatedSellTokenUsdValue = calculateEstimatedUsdValue({
    tokenInfo: fromToken,
    tokenAmount: sellAmount,
  })
  const estimatedBuyTokenUsdValue = calculateEstimatedUsdValue({
    tokenInfo: toToken,
    tokenAmount: buyAmount,
  })

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
    provider: action.payload.quote.rawSwapResponse.details.swapProvider,
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

    const wallet = yield* call(getViemWallet, networkConfig.viemChain.celo)
    if (!wallet.account) {
      // this should never happen
      throw new Error('no account found in the wallet')
    }

    const preparedTransactions = action.payload.quote.preparedTransactions
    if (preparedTransactions?.type !== 'possible') {
      // Should never happen
      throw new Error('No prepared transactions possible')
    }

    // @ts-ignore
    const block = yield* call(getBlock, wallet, { blockTag: 'latest' })
    // @ts-ignore
    let nonce: number = yield* call(getTransactionCount, wallet, {
      address: wallet.account.address,
      blockTag: 'pending',
    })

    console.log('==block==', block)
    console.log('==nonce==', nonce)

    // unlock account before executing tx
    yield* call(unlockAccount, wallet.account.address)

    // Execute transaction
    yield* put(swapExecute())
    Logger.debug(TAG, `Starting to swap execute for address: ${wallet.account.address}`)

    const beforeSwapExecutionTimestamp = Date.now()
    quoteToTransactionElapsedTimeInMs = beforeSwapExecutionTimestamp - quoteReceivedAt

    const txHashes: Hash[] = []
    for (let preparedTransaction of [
      preparedTransactions.approveTransaction,
      preparedTransactions.swapTransaction,
    ]) {
      console.log('==Signing', preparedTransaction)
      const signedTx = yield* call([wallet, 'signTransaction'], {
        ...preparedTransaction,
        nonce: nonce++,
      } as any)
      console.log('==signedTx==', signedTx)
      const hash = yield* call([wallet, 'sendRawTransaction'], {
        serializedTransaction: signedTx,
      })
      console.log('==hash==', hash)
      txHashes.push(hash)
    }

    const swapTxHash = txHashes[txHashes.length - 1]

    yield* put(
      addStandbyTransaction({
        context: swapExecuteContext,
        __typename: 'TokenExchangeV3',
        networkId: networkConfig.defaultNetworkId,
        type: TokenTransactionTypeV2.SwapTransaction,
        inAmount: {
          value: valueToBigNumber(sellAmount)
            .multipliedBy(guaranteedPrice)
            .shiftedBy(-toToken.decimals),
          tokenId: toToken.tokenId,
        },
        outAmount: {
          value: valueToBigNumber(sellAmount).shiftedBy(-fromToken.decimals),
          tokenId: fromToken.tokenId,
        },
        transactionHash: swapTxHash,
      })
    )

    const receipt = yield* call([publicClient.celo, 'waitForTransactionReceipt'], {
      hash: swapTxHash,
    })
    console.log('==receipt==', receipt)
    if (receipt.status !== 'success') {
      throw new Error('Swap transaction reverted')
    }

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
  // Legacy
  yield* takeLatest(swapStart.type, safely(swapSubmitSaga))
  // New flow with prepared transactions
  yield* takeLatest(swapStartPrepared.type, safely(swapSubmitPreparedSaga))
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

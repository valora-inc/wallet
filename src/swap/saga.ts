import { CeloTransactionObject, CeloTx, Contract, toTransactionObject } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { PayloadAction } from '@reduxjs/toolkit'
import BigNumber from 'bignumber.js'
import { SwapEvents } from 'src/analytics/Events'
import {
  PrefixedTxReceiptProperties,
  SwapTimeMetrics,
  SwapTxsReceiptProperties,
  TxReceiptProperties,
} from 'src/analytics/Properties'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { CANCELLED_PIN_INPUT } from 'src/pincode/authentication'
import { vibrateError, vibrateSuccess } from 'src/styles/hapticFeedback'
import { getSwapTxsAnalyticsProperties } from 'src/swap/getSwapTxsAnalyticsProperties'
import { swapCancel, swapError, swapStart, swapStartPrepared, swapSuccess } from 'src/swap/slice'
import { Field, SwapInfo, SwapInfoPrepared, SwapTransaction } from 'src/swap/types'
import { getERC20TokenContract } from 'src/tokens/saga'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance, TokenBalances } from 'src/tokens/slice'
import { getSupportedNetworkIdsForSwap, getTokenId } from 'src/tokens/utils'
import { addStandbyTransaction, removeStandbyTransaction } from 'src/transactions/actions'
import { handleTransactionReceiptReceived } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import {
  NetworkId,
  TokenTransactionTypeV2,
  TransactionContext,
  newTransactionContext,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { publicClient } from 'src/viem'
import { TransactionRequest, getFeeCurrency, getMaxGasFee } from 'src/viem/prepareTransactions'
import { getPreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import { getContractKit, getViemWallet } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount, unlockAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { applyChainIdWorkaround, buildTxo, getNetworkFromNetworkId } from 'src/web3/utils'
import { call, put, select, takeEvery } from 'typed-redux-saga'
import { Hash, TransactionReceipt, zeroAddress } from 'viem'
import { getTransactionCount } from 'viem/actions'

const TAG = 'swap/saga'

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

  const networkId = networkConfig.defaultNetworkId
  const feeCurrencyId = getTokenId(networkId, tx.feeCurrency)

  const outValue = valueToBigNumber(rawTx.sellAmount).shiftedBy(-fromToken.decimals)
  yield* put(
    addStandbyTransaction({
      context: transactionContext,
      __typename: 'TokenExchangeV3',
      networkId,
      type: TokenTransactionTypeV2.SwapTransaction,
      inAmount: {
        value: outValue.multipliedBy(rawTx.guaranteedPrice),
        tokenId: toToken.tokenId,
      },
      outAmount: {
        value: outValue,
        tokenId: fromToken.tokenId,
      },
      feeCurrencyId,
    })
  )

  const receipt = yield* call(sendTransaction, txo, walletAddress, transactionContext)
  yield* call(
    handleTransactionReceiptReceived,
    transactionContext.id,
    receipt,
    networkId,
    feeCurrencyId
  )
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
  const swapId = action.payload.swapId
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

  const tokensById = yield* select((state) =>
    tokensByIdSelector(state, [networkConfig.defaultNetworkId])
  )
  const fromToken = tokensById[action.payload.userInput.fromTokenId]
  const toToken = tokensById[action.payload.userInput.toTokenId]

  if (!fromToken || !toToken) {
    Logger.error(
      TAG,
      `Could not find to or from token for swap from ${sellTokenAddress} to ${buyTokenAddress}`
    )
    yield* put(swapError(swapId))
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
    toTokenId: toToken.tokenId,
    toTokenNetworkId: toToken.networkId,
    fromToken: sellTokenAddress,
    fromTokenId: fromToken.tokenId,
    fromTokenNetworkId: fromToken.networkId,
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
    web3Library: 'contract-kit' as const,
  }

  let quoteToTransactionElapsedTimeInMs: number | undefined

  const getTimeMetrics = (): SwapTimeMetrics => ({
    quoteToUserConfirmsSwapElapsedTimeInMs: swapSubmittedAt - quoteReceivedAt,
    quoteToTransactionElapsedTimeInMs,
  })

  try {
    const walletAddress = yield* select(walletAddressSelector)

    // Approve transaction if the sell token is ERC-20
    if (allowanceTarget !== zeroAddress && fromToken.address) {
      const amountToApprove =
        amountType === 'buyAmount'
          ? valueToBigNumber(buyAmount).times(guaranteedPrice).toFixed(0, 0)
          : sellAmount

      // Approve transaction
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

    navigate(Screens.WalletHome)

    const timeMetrics = getTimeMetrics()

    yield* put(swapSuccess(swapId))
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
    yield* put(swapError(swapId))
    yield* put(removeStandbyTransaction(swapExecuteContext.id))
    vibrateError()
  }
}

interface TrackedTx {
  tx: TransactionRequest | undefined
  txHash: Hash | undefined
  txReceipt: TransactionReceipt | undefined
}

function getTxReceiptAnalyticsProperties(
  { tx, txHash, txReceipt }: TrackedTx,
  networkId: NetworkId,
  tokensById: TokenBalances
): Partial<TxReceiptProperties> {
  const txFeeCurrency = tx && getFeeCurrency(tx)
  const feeCurrencyToken = tokensById[getTokenId(networkId, txFeeCurrency)]

  const txMaxGasFee =
    tx && feeCurrencyToken ? getMaxGasFee([tx]).shiftedBy(-feeCurrencyToken.decimals) : undefined
  const txMaxGasFeeUsd =
    feeCurrencyToken && txMaxGasFee && feeCurrencyToken.priceUsd
      ? txMaxGasFee.times(feeCurrencyToken.priceUsd)
      : undefined

  const txGasFee =
    txReceipt?.gasUsed && txReceipt?.effectiveGasPrice && feeCurrencyToken
      ? new BigNumber((txReceipt.gasUsed * txReceipt.effectiveGasPrice).toString()).shiftedBy(
          -feeCurrencyToken.decimals
        )
      : undefined
  const txGasFeeUsd =
    feeCurrencyToken && txGasFee && feeCurrencyToken.priceUsd
      ? txGasFee.times(feeCurrencyToken.priceUsd)
      : undefined

  return {
    txCumulativeGasUsed: txReceipt?.cumulativeGasUsed
      ? Number(txReceipt.cumulativeGasUsed)
      : undefined,
    txEffectiveGasPrice: txReceipt?.effectiveGasPrice
      ? Number(txReceipt.effectiveGasPrice)
      : undefined,
    txGas: tx?.gas ? Number(tx.gas) : undefined,
    txMaxGasFee: txMaxGasFee?.toNumber(),
    txMaxGasFeeUsd: txMaxGasFeeUsd?.toNumber(),
    txGasUsed: txReceipt?.gasUsed ? Number(txReceipt.gasUsed) : undefined,
    txGasFee: txGasFee?.toNumber(),
    txGasFeeUsd: txGasFeeUsd?.toNumber(),
    txHash,
    txFeeCurrency,
    txFeeCurrencySymbol: feeCurrencyToken?.symbol,
  }
}

function getPrefixedTxAnalyticsProperties<Prefix extends string>(
  receiptProperties: Partial<TxReceiptProperties>,
  prefix: Prefix
): Partial<PrefixedTxReceiptProperties<Prefix>> {
  const prefixedProperties: Record<string, any> = {}
  for (const [key, value] of Object.entries(receiptProperties)) {
    prefixedProperties[`${prefix}${key[0].toUpperCase()}${key.slice(1)}`] = value
  }
  return prefixedProperties as Partial<PrefixedTxReceiptProperties<Prefix>>
}

function getSwapTxsReceiptAnalyticsProperties(
  trackedTxs: TrackedTx[],
  networkId: NetworkId,
  tokensById: TokenBalances
): SwapTxsReceiptProperties {
  const txs = trackedTxs.map((trackedTx) =>
    getTxReceiptAnalyticsProperties(trackedTx, networkId, tokensById)
  )

  const approveTx = trackedTxs.length > 1 ? txs[0] : undefined
  const swapTx = trackedTxs.length > 0 ? txs[txs.length - 1] : undefined

  return {
    ...getPrefixedTxAnalyticsProperties(approveTx || {}, 'approve'),
    ...getPrefixedTxAnalyticsProperties(swapTx || {}, 'swap'),
    gasUsed: swapTx?.txGasUsed ? txs.reduce((sum, tx) => sum + (tx.txGasUsed || 0), 0) : undefined,
    gasFee: swapTx?.txGasFee ? txs.reduce((sum, tx) => sum + (tx.txGasFee || 0), 0) : undefined,
    gasFeeUsd: swapTx?.txGasFeeUsd
      ? txs.reduce((sum, tx) => sum + (tx.txGasFeeUsd || 0), 0)
      : undefined,
  }
}

export function* swapSubmitPreparedSaga(action: PayloadAction<SwapInfoPrepared>) {
  const swapSubmittedAt = Date.now()
  const swapId = action.payload.swapId
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
  const preparedTransactions = getPreparedTransactions(action.payload.quote.preparedTransactions)
  const quoteReceivedAt = action.payload.quote.receivedAt

  const tokensById = yield* select((state) =>
    tokensByIdSelector(state, getSupportedNetworkIdsForSwap())
  )
  const fromToken = tokensById[action.payload.userInput.fromTokenId]
  const toToken = tokensById[action.payload.userInput.toTokenId]

  if (!fromToken || !toToken) {
    Logger.error(
      TAG,
      `Could not find to or from token for swap from ${sellTokenAddress} to ${buyTokenAddress}`
    )
    yield* put(swapError(swapId))
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
    toTokenId: toToken.tokenId,
    toTokenNetworkId: toToken.networkId,
    fromToken: sellTokenAddress,
    fromTokenId: fromToken.tokenId,
    fromTokenNetworkId: fromToken.networkId,
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
    web3Library: 'viem' as const,
    ...getSwapTxsAnalyticsProperties(preparedTransactions, fromToken.networkId, tokensById),
  }

  let quoteToTransactionElapsedTimeInMs: number | undefined

  const getTimeMetrics = (): SwapTimeMetrics => ({
    quoteToUserConfirmsSwapElapsedTimeInMs: swapSubmittedAt - quoteReceivedAt,
    quoteToTransactionElapsedTimeInMs,
  })

  const trackedTxs: TrackedTx[] = []
  const networkId = fromToken.networkId

  let submitted = false

  try {
    const network = getNetworkFromNetworkId(networkId)
    if (!network) {
      throw new Error('Unknown token network')
    }

    const wallet = yield* call(getViemWallet, networkConfig.viemChain[network])
    if (!wallet.account) {
      // this should never happen
      throw new Error('no account found in the wallet')
    }

    for (const tx of preparedTransactions) {
      trackedTxs.push({
        tx,
        txHash: undefined,
        txReceipt: undefined,
      })
    }

    // @ts-ignore typed-redux-saga erases the parameterized types causing error, we can address this separately
    let nonce: number = yield* call(getTransactionCount, wallet, {
      address: wallet.account.address,
      blockTag: 'pending',
    })

    // Unlock account before executing tx
    yield* call(unlockAccount, wallet.account.address)

    // Execute transaction(s)
    Logger.debug(TAG, `Starting to swap execute for address: ${wallet.account.address}`)

    const beforeSwapExecutionTimestamp = Date.now()
    quoteToTransactionElapsedTimeInMs = beforeSwapExecutionTimestamp - quoteReceivedAt

    const txHashes: Hash[] = []
    for (const preparedTransaction of preparedTransactions) {
      const signedTx = yield* call([wallet, 'signTransaction'], {
        ...preparedTransaction,
        nonce: nonce++,
      } as any)
      const hash = yield* call([wallet, 'sendRawTransaction'], {
        serializedTransaction: signedTx,
      })
      txHashes.push(hash)
    }

    for (let i = 0; i < txHashes.length; i++) {
      trackedTxs[i].txHash = txHashes[i]
    }

    Logger.debug(TAG, 'Successfully sent swap transaction(s) to the network', txHashes)

    const feeCurrencyId = getTokenId(networkId, getFeeCurrency(preparedTransactions))

    const swapTxHash = txHashes[txHashes.length - 1]

    const outValue = valueToBigNumber(sellAmount).shiftedBy(-fromToken.decimals)
    yield* put(
      addStandbyTransaction({
        context: swapExecuteContext,
        __typename: 'TokenExchangeV3',
        networkId,
        type: TokenTransactionTypeV2.SwapTransaction,
        inAmount: {
          value: outValue.multipliedBy(guaranteedPrice),
          tokenId: toToken.tokenId,
        },
        outAmount: {
          value: outValue,
          tokenId: fromToken.tokenId,
        },
        transactionHash: swapTxHash,
        feeCurrencyId,
      })
    )
    navigate(Screens.WalletHome)
    submitted = true

    const swapTxReceipt = yield* call([publicClient[network], 'waitForTransactionReceipt'], {
      hash: swapTxHash,
    })
    Logger.debug('Got swap transaction receipt', swapTxReceipt)
    trackedTxs[trackedTxs.length - 1].txReceipt = swapTxReceipt

    // Also get the receipt of the first transaction (approve), for tracking purposes
    try {
      if (txHashes.length > 1) {
        const approveTxReceipt = yield* call([publicClient[network], 'getTransactionReceipt'], {
          hash: txHashes[0],
        })
        Logger.debug('Got approve transaction receipt', approveTxReceipt)
        trackedTxs[0].txReceipt = approveTxReceipt
      }
    } catch (e) {
      Logger.warn(TAG, 'Error getting approve transaction receipt', e)
    }

    yield* call(
      handleTransactionReceiptReceived,
      swapExecuteContext.id,
      swapTxReceipt,
      networkId,
      feeCurrencyId
    )

    if (swapTxReceipt.status !== 'success') {
      throw new Error(`Swap transaction reverted: ${swapTxReceipt.transactionHash}`)
    }

    yield* put(swapSuccess(swapId))
    ValoraAnalytics.track(SwapEvents.swap_execute_success, {
      ...defaultSwapExecuteProps,
      ...getTimeMetrics(),
      ...getSwapTxsReceiptAnalyticsProperties(trackedTxs, networkId, tokensById),
    })
  } catch (err) {
    if (err === CANCELLED_PIN_INPUT) {
      Logger.info(TAG, 'Swap cancelled by user')
      yield* put(swapCancel(swapId))
      return
    }
    const error = ensureError(err)
    // dispatch the error early, in case the rest of the handling throws
    // and leaves the app in a bad state
    yield* put(swapError(swapId))
    // Only vibrate if we haven't already submitted the transaction
    // since the user may be doing something else on the app by now
    // (different screen or a new swap)
    if (!submitted) {
      vibrateError()
    }

    Logger.error(TAG, 'Error while swapping', error)
    ValoraAnalytics.track(SwapEvents.swap_execute_error, {
      ...defaultSwapExecuteProps,
      ...getTimeMetrics(),
      ...getSwapTxsReceiptAnalyticsProperties(trackedTxs, networkId, tokensById),
      error: error.message,
    })
  }
}

export function* swapSaga() {
  // Legacy
  yield* takeEvery(swapStart.type, safely(swapSubmitSaga))
  // New flow with prepared transactions
  yield* takeEvery(swapStartPrepared.type, safely(swapSubmitPreparedSaga))
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

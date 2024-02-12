import BigNumber from 'bignumber.js'
import { SendOrigin } from 'src/analytics/types'
import { MAX_ENCRYPTED_COMMENT_LENGTH_APPROX } from 'src/config'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import {
  convertDollarsToLocalAmount,
  convertLocalAmountToDollars,
  convertToMaxSupportedPrecision,
} from 'src/localCurrency/convert'
import { fetchExchangeRate } from 'src/localCurrency/saga'
import { getLocalCurrencyCode, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { UriData, uriDataFromUrl } from 'src/qrcode/schema'
import { AddressRecipient, Recipient, RecipientType } from 'src/recipients/recipient'
import { updateValoraRecipientCache } from 'src/recipients/reducer'
import { canSendTokensSelector } from 'src/send/selectors'
import { TransactionDataInput } from 'src/send/types'
import { prepareSendTransactionsCallback } from 'src/send/usePrepareSendTransactions'
import { feeCurrenciesSelector, tokensListSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { convertLocalToTokenAmount, getSupportedNetworkIdsForSend } from 'src/tokens/utils'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import {
  getSerializablePreparedTransaction,
  SerializableTransactionRequest,
} from 'src/viem/preparedTransactionSerialization'
import { getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, put, select } from 'typed-redux-saga'

export const COMMENT_PLACEHOLDER_FOR_FEE_ESTIMATE = ' '.repeat(MAX_ENCRYPTED_COMMENT_LENGTH_APPROX)

const TAG = 'send/utils'

export function* handleSendPaymentData(
  data: UriData,
  isFromScan: boolean,
  cachedRecipient?: Recipient
) {
  const recipient: AddressRecipient = {
    address: data.address.toLowerCase(),
    name: data.displayName || cachedRecipient?.name,
    e164PhoneNumber: data.e164PhoneNumber,
    displayNumber: cachedRecipient?.displayNumber,
    thumbnailPath: cachedRecipient?.thumbnailPath,
    contactId: cachedRecipient?.contactId,
    recipientType: RecipientType.Address,
  }
  yield* put(
    updateValoraRecipientCache({
      [data.address.toLowerCase()]: recipient,
    })
  )

  const supportedNetworkIds = yield* select(getSupportedNetworkIdsForSend)
  const tokens: TokenBalance[] = yield* select((state) =>
    tokensListSelector(state, supportedNetworkIds)
  )
  const tokenInfo = tokens.find((token) => token?.symbol === (data.token ?? Currency.Dollar))

  if (!tokenInfo?.priceUsd) {
    navigate(Screens.SendEnterAmount, {
      recipient,
      isFromScan,
      origin: SendOrigin.AppSendFlow,
      defaultTokenIdOverride: data.token ? tokenInfo?.tokenId : undefined,
      forceTokenId: !!(data.token && tokenInfo?.tokenId),
    })
    return
  }

  if (data.amount && tokenInfo?.address) {
    const currency: LocalCurrencyCode = data.currencyCode
      ? (data.currencyCode as LocalCurrencyCode)
      : yield* select(getLocalCurrencyCode)
    const exchangeRate = yield* call(fetchExchangeRate, LocalCurrencyCode.USD, currency)
    const dollarAmount = convertLocalAmountToDollars(data.amount, exchangeRate)
    const usdToLocalRate = yield* select(usdToLocalCurrencyRateSelector)
    const localAmount = convertDollarsToLocalAmount(dollarAmount, usdToLocalRate)
    const inputAmount = localAmount && convertToMaxSupportedPrecision(localAmount)
    const tokenAmount = convertLocalToTokenAmount({
      localAmount: inputAmount,
      tokenInfo,
      usdToLocalRate,
    })
    if (!inputAmount || !tokenAmount) {
      Logger.warn(TAG, '@handleSendPaymentData null amount')
      return
    }
    const transactionData: TransactionDataInput = {
      recipient,
      inputAmount,
      amountIsInLocalCurrency: true,
      tokenAddress: tokenInfo.address,
      tokenAmount,
      tokenId: tokenInfo.tokenId,
      comment: data.comment,
    }

    const { preparedTransaction, feeAmount, feeTokenId } = yield* call(
      preparePaymentRequestTransaction,
      {
        amount: tokenAmount,
        token: tokenInfo,
        recipientAddress: recipient.address,
      }
    )

    navigate(Screens.SendConfirmation, {
      transactionData,
      isFromScan,
      origin: SendOrigin.AppSendFlow,
      preparedTransaction,
      feeAmount,
      feeTokenId,
    })
  } else {
    const canSendTokens: boolean = yield* select(canSendTokensSelector)
    if (!canSendTokens) {
      throw new Error("Precondition failed: Can't send tokens from payment data")
    }
    navigate(Screens.SendEnterAmount, {
      recipient,
      isFromScan,
      origin: SendOrigin.AppSendFlow,
      defaultTokenIdOverride: data.token ? tokenInfo?.tokenId : undefined,
      forceTokenId: !!(data.token && tokenInfo?.tokenId),
    })
  }
}

export function* handlePaymentDeeplink(deeplink: string) {
  try {
    const paymentData = uriDataFromUrl(deeplink)
    yield* call(handleSendPaymentData, paymentData, true)
  } catch (e) {
    Logger.warn('handlePaymentDeepLink', `deeplink ${deeplink} failed with ${e}`)
  }
}

export function* preparePaymentRequestTransaction({
  amount,
  token,
  recipientAddress,
}: {
  amount: BigNumber
  token: TokenBalance
  recipientAddress: string
}) {
  let preparedTransaction: SerializableTransactionRequest | undefined = undefined
  let feeAmount: string | undefined = undefined
  let feeTokenId: string | undefined = undefined
  const feeCurrencies = yield* select(feeCurrenciesSelector, token.networkId)
  const walletAddress = yield* select(walletAddressSelector)

  if (!walletAddress) {
    // should never happen
    throw new Error('wallet address not found')
  }

  try {
    const prepareTransactionsResult = yield* call(prepareSendTransactionsCallback, {
      amount,
      token,
      recipientAddress,
      walletAddress,
      feeCurrencies,
      comment: COMMENT_PLACEHOLDER_FOR_FEE_ESTIMATE, // use placeholder since comment can be edited on the confirmation screen
    })

    if (
      prepareTransactionsResult?.type === 'possible' &&
      prepareTransactionsResult.transactions.length > 0
    ) {
      preparedTransaction = getSerializablePreparedTransaction(
        prepareTransactionsResult.transactions[0]
      )
      const { maxFeeAmount, feeCurrency } = getFeeCurrencyAndAmounts(prepareTransactionsResult)
      feeAmount = maxFeeAmount?.toString()
      feeTokenId = feeCurrency?.tokenId
    }
  } catch (err) {
    Logger.warn(`${TAG}/preparePaymentRequestTransaction`, 'Unable to prepare transaction', err)
  }

  // if a tx cannot be prepared or is not possible, return undefined, so the
  // Send button in the SendConfirmation screen is disabled
  return {
    preparedTransaction,
    feeAmount,
    feeTokenId,
  }
}

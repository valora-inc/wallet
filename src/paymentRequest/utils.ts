import { decryptComment, encryptComment } from '@celo/cryptographic-utils'
import { isE164NumberStrict } from '@celo/phone-utils'
import { hexToBuffer } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { call } from 'redux-saga/effects'
import { MAX_COMMENT_LENGTH } from 'src/config'
import { features } from 'src/flags'
import i18n from 'src/i18n'
import { PaymentRequest, WriteablePaymentRequest } from 'src/paymentRequest/types'
import { Recipient } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { Currency } from 'src/utils/currencies'
import { doFetchDataEncryptionKey } from 'src/web3/dataEncryptionKey'

const TAG = 'paymentRequest/utils'

// Convert a payment request into a transaction data object if user has enough balance
export const transactionDataFromPaymentRequest = ({
  paymentRequest,
  stableTokens,
  requester,
}: {
  paymentRequest: PaymentRequest
  stableTokens: TokenBalance[]
  requester: Recipient
}): TransactionDataInput | undefined => {
  const cUsdTokenInfo = stableTokens.find((token) => token?.symbol === Currency.Dollar)
  const cEurTokenInfo = stableTokens.find((token) => token?.symbol === Currency.Euro)
  if (!cUsdTokenInfo?.address || !cEurTokenInfo?.address) {
    // Should never happen in production
    throw new Error('No token address found for cUSD or cEUR')
  }
  // If the user has enough cUSD balance, pay with cUSD
  // Else, try with cEUR
  // Else, return undefined which should be used to display an error message
  const usdRequested = new BigNumber(paymentRequest.amount)

  if (
    cUsdTokenInfo.usdPrice &&
    usdRequested.isLessThanOrEqualTo(cUsdTokenInfo.balance.multipliedBy(cUsdTokenInfo.usdPrice))
  ) {
    return {
      comment: paymentRequest.comment,
      recipient: requester,
      inputAmount: new BigNumber(paymentRequest.amount),
      tokenAmount: new BigNumber(paymentRequest.amount),
      amountIsInLocalCurrency: false,
      tokenAddress: cUsdTokenInfo.address,
      paymentRequestId: paymentRequest.uid || '',
    }
  } else if (
    cEurTokenInfo.usdPrice &&
    usdRequested.isLessThanOrEqualTo(cEurTokenInfo.balance.multipliedBy(cEurTokenInfo.usdPrice))
  ) {
    return {
      comment: paymentRequest.comment,
      recipient: requester,
      inputAmount: new BigNumber(paymentRequest.amount).dividedBy(cEurTokenInfo.usdPrice),
      tokenAmount: new BigNumber(paymentRequest.amount).dividedBy(cEurTokenInfo.usdPrice),
      amountIsInLocalCurrency: false,
      tokenAddress: cEurTokenInfo.address,
      paymentRequestId: paymentRequest.uid || '',
    }
  }
}

// Encrypt sensitive data in the payment request using the recipient and sender DEK
export function* encryptPaymentRequest(paymentRequest: WriteablePaymentRequest) {
  Logger.debug(`${TAG}@encryptPaymentRequest`, 'Encrypting payment request')

  const fromKey: Buffer | null = yield call(
    doFetchDataEncryptionKey,
    paymentRequest.requesterAddress
  )
  if (!fromKey) {
    Logger.debug(`${TAG}@encryptPaymentRequest`, 'No sender key found, skipping encryption')
    return sanitizePaymentRequest(paymentRequest)
  }

  const toKey: Buffer | null = yield call(doFetchDataEncryptionKey, paymentRequest.requesteeAddress)
  if (!toKey) {
    Logger.debug(`${TAG}@encryptPaymentRequest`, 'No recipient key found, skipping encryption')
    return sanitizePaymentRequest(paymentRequest)
  }

  const encryptedPaymentRequest: WriteablePaymentRequest = {
    ...paymentRequest,
  }

  if (paymentRequest.requesterE164Number) {
    // Using the same util as for comment encryption to encrypt the phone number
    // TODO: Consider renaming this util for clarity
    const { comment: encryptedE164Number, success } = encryptComment(
      paymentRequest.requesterE164Number,
      toKey,
      fromKey
    )

    // We intentionally exclude the phone number if we can't encrypt it
    // The request still contains an address which may still map to a contact
    // If the recipient has seen it before.
    encryptedPaymentRequest.requesterE164Number = success ? encryptedE164Number : undefined
  }

  const comment = paymentRequest.comment
  if (comment && features.USE_COMMENT_ENCRYPTION) {
    const { comment: encryptedComment, success } = encryptComment(comment, toKey, fromKey)
    encryptedPaymentRequest.comment = success ? encryptedComment : comment
  }

  return encryptedPaymentRequest
}

// Decrypt sensitive data in the payment request using the user's DEK
export function decryptPaymentRequest(
  paymentRequest: PaymentRequest,
  dataEncryptionKey: string | null,
  isOutgoingRequest: boolean
) {
  Logger.debug(`${TAG}@decryptPaymentRequest`, 'Decrypting payment request')

  if (!dataEncryptionKey) {
    Logger.error(`${TAG}@decryptPaymentRequest`, 'Missing DEK, should never happen.')
    return paymentRequest
  }
  const dekBuffer = hexToBuffer(dataEncryptionKey)

  const decryptedPaymentRequest: PaymentRequest = {
    ...paymentRequest,
  }

  const requesterE164Number = paymentRequest.requesterE164Number
  if (requesterE164Number) {
    const { comment: decryptedRequesterE164Number, success } = decryptComment(
      requesterE164Number,
      dekBuffer,
      isOutgoingRequest
    )
    if (success) {
      decryptedPaymentRequest.requesterE164Number = decryptedRequesterE164Number
    } else if (isE164NumberStrict(requesterE164Number)) {
      Logger.warn(
        `${TAG}@decryptPaymentRequest`,
        'Decrypting requesterE164Number failed, using raw number'
      )
      decryptedPaymentRequest.requesterE164Number = requesterE164Number
    } else {
      Logger.warn(
        `${TAG}@decryptPaymentRequest`,
        'requesterE164Number appears to be ciphertext, excluding it'
      )
      decryptedPaymentRequest.requesterE164Number = undefined
    }
  }

  const comment = paymentRequest.comment
  if (comment && features.USE_COMMENT_ENCRYPTION) {
    const { comment: decryptedComment, success } = decryptComment(
      comment,
      dekBuffer,
      isOutgoingRequest
    )
    if (success) {
      decryptedPaymentRequest.comment = decryptedComment
    } else if (comment.length <= MAX_COMMENT_LENGTH) {
      Logger.warn(`${TAG}@decryptPaymentRequest`, 'Decrypting comment failed, using raw comment')
      decryptedPaymentRequest.comment = comment
    } else {
      Logger.warn(
        `${TAG}@decryptPaymentRequest`,
        'Comment appears to be ciphertext, hiding comment'
      )
      decryptedPaymentRequest.comment = i18n.t('commentUnavailable') ?? undefined
    }
  }

  return decryptedPaymentRequest
}

// For cases when the request can't be encrypted, remove sensitive PII
function sanitizePaymentRequest(paymentRequest: WriteablePaymentRequest): WriteablePaymentRequest {
  return {
    ...paymentRequest,
    requesterE164Number: undefined,
  }
}

// Wallet utilities for comment encryption and comment key management
// Use these instead of the functions in @celo/utils/lib/commentEncryption
// because these manage comment metadata

import {
  decryptComment as decryptCommentRaw,
  encryptComment as encryptCommentRaw,
} from '@celo/cryptographic-utils'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { hexToBuffer } from '@celo/utils/lib/address'
import { memoize, values } from 'lodash'
import { MAX_COMMENT_LENGTH } from 'src/config'
import { features } from 'src/flags'
import i18n from 'src/i18n'
import { getUserSelfPhoneHashDetails } from 'src/identity/privateHashing'
import Logger from 'src/utils/Logger'
import { doFetchDataEncryptionKey } from 'src/web3/dataEncryptionKey'
import { call } from 'typed-redux-saga'

const TAG = 'identity/commentKey'
// A separator to split the comment content from the metadata
const METADATA_CONTENT_SEPARATOR = '~'
// Format should be separator + e164Number + salt
const PHONE_METADATA_REGEX = new RegExp(
  `(.*)${METADATA_CONTENT_SEPARATOR}([+][1-9][0-9]{1,14})([a-zA-Z0-9+/]{13})$`
)

export function* encryptComment(
  comment: string | null,
  toAddress: string | null,
  fromAddress: string | null,
  includePhoneNumMetadata: boolean = false
) {
  Logger.debug(TAG + 'encryptComment', 'Encrypting comment')
  if (!features.USE_COMMENT_ENCRYPTION || !comment || !toAddress || !fromAddress) {
    Logger.debug(TAG, 'Invalid params, skipping encryption')
    return comment
  }

  const fromKey = yield* call(doFetchDataEncryptionKey, fromAddress)
  if (!fromKey) {
    Logger.debug(TAG + 'encryptComment', 'No sender key found, skipping encryption')
    return comment
  }

  const toKey = yield* call(doFetchDataEncryptionKey, toAddress)
  if (!toKey) {
    Logger.debug(TAG + 'encryptComment', 'No recipient key found, skipping encryption')
    return comment
  }

  let commentToEncrypt = comment
  if (features.PHONE_NUM_METADATA_IN_TRANSFERS && includePhoneNumMetadata) {
    Logger.debug(TAG + 'encryptComment', 'Including phone number metadata in comment')
    const selfPhoneDetails: PhoneNumberHashDetails | undefined = yield* call(
      getUserSelfPhoneHashDetails
    )
    commentToEncrypt = embedPhoneNumberMetadata(comment, selfPhoneDetails)
  }

  const { comment: encryptedComment, success } = encryptCommentRaw(
    commentToEncrypt,
    hexToBuffer(toKey),
    hexToBuffer(fromKey)
  )

  if (success) {
    Logger.debug(TAG + 'encryptComment', 'Encryption succeeded')
    return encryptedComment
  } else {
    Logger.error(TAG + 'encryptComment', 'Encrytion failed, returning raw comment')
    return comment
  }
}

interface DecryptedComment {
  comment: string | null
  e164Number?: string
  salt?: string
}

// Memoize to avoid computing decryptions more than once per comment
// TODO investigate whether its worth it to save this in persisted state, maybe Apollo cache?
export const decryptComment = memoize(_decryptComment, (...args) => values(args).join('_'))

function _decryptComment(
  comment: string | null,
  dataEncryptionKey: string | null,
  isSender: boolean
): DecryptedComment {
  Logger.debug(TAG + 'decryptComment', 'Decrypting comment')

  if (!features.USE_COMMENT_ENCRYPTION || !comment || !dataEncryptionKey) {
    Logger.debug(TAG + 'decryptComment', 'Invalid params, skipping decryption')
    return { comment }
  }

  const { comment: decryptedComment, success } = decryptCommentRaw(
    comment,
    hexToBuffer(dataEncryptionKey),
    isSender
  )

  if (success) {
    Logger.debug(TAG + 'decryptComment', 'Comment decryption succeeded')
    return extractPhoneNumberMetadata(decryptedComment)
  } else if (comment.length <= MAX_COMMENT_LENGTH) {
    Logger.warn(TAG + 'decryptComment', 'Decrypting comment failed, returning raw comment')
    return { comment }
  } else {
    // Since we've changed the DEK derivation strategy, comment decryption would fail
    // for old comments and/or mismatch between DEK types btwn sender + receiver
    // To cover this case, the comment is hidden instead of showing garbage
    Logger.warn(TAG + 'decryptComment', 'Comment appears to be ciphertext, hiding comment')
    return { comment: i18n.t('commentUnavailable') }
  }
}

export function embedPhoneNumberMetadata(
  comment: string,
  phoneNumberDetails?: PhoneNumberHashDetails
) {
  return phoneNumberDetails
    ? comment +
        METADATA_CONTENT_SEPARATOR +
        phoneNumberDetails.e164Number +
        phoneNumberDetails.pepper
    : comment
}

export function extractPhoneNumberMetadata(commentData: string) {
  const phoneNumMetadata = commentData.match(PHONE_METADATA_REGEX)
  if (!phoneNumMetadata || phoneNumMetadata.length < 4) {
    return { comment: commentData }
  }

  return {
    comment: phoneNumMetadata[1],
    e164Number: phoneNumMetadata[2],
    salt: phoneNumMetadata[3],
  }
}

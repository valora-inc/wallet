import { TFunction } from 'i18next'
import * as _ from 'lodash'
import { useTranslation } from 'react-i18next'
import {
  ExchangeItemFragment,
  TokenTransactionType,
  TransferItemFragment,
  UserTransactionsQuery,
} from 'src/apollo/types'
import { CELO_LOGO_URL, DEFAULT_TESTNET, SUPERCHARGE_LOGO_URL } from 'src/config'
import { ProviderFeedInfo, txHashToFeedInfoSelector } from 'src/fiatExchanges/reducer'
import { decryptComment } from 'src/identity/commentEncryption'
import { AddressToE164NumberType } from 'src/identity/reducer'
import {
  addressToDisplayNameSelector,
  addressToE164NumberSelector,
  identifierToE164NumberSelector,
} from 'src/identity/selectors'
import {
  getDisplayName,
  getRecipientFromAddress,
  NumberToRecipient,
  Recipient,
  recipientHasNumber,
  RecipientInfo,
} from 'src/recipients/recipient'
import {
  inviteRewardsSendersSelector,
  phoneRecipientCacheSelector,
  recipientInfoSelector,
  rewardsSendersSelector,
} from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { useTokenInfo } from 'src/tokens/hooks'
import { FeedTokenTransfer } from 'src/transactions/feed/TransferFeedItem'
import {
  inviteTransactionsSelector,
  KnownFeedTransactionsType,
  recentTxRecipientsCacheSelector,
} from 'src/transactions/reducer'
import { TokenTransactionTypeV2, TokenTransfer, TransactionStatus } from 'src/transactions/types'
import { timeDeltaInDays } from 'src/utils/time'
import { isPresent } from 'src/utils/typescript'
import { dataEncryptionKeySelector } from 'src/web3/selectors'

export function getDecryptedTransferFeedComment(
  comment: string | null,
  commentKey: string | null,
  type: TokenTransactionType | TokenTransactionTypeV2
) {
  const { comment: decryptedComment } = decryptComment(comment, commentKey, isTokenTxTypeSent(type))
  return decryptedComment
}

function getRecipient(
  type: TokenTransactionType,
  e164PhoneNumber: string | null,
  recipientCache: NumberToRecipient,
  recentTxRecipientsCache: NumberToRecipient,
  txTimestamp: number,
  address: string,
  recipientInfo: RecipientInfo,
  providerInfo: ProviderFeedInfo | undefined,
  defaultName?: string,
  defaultImage?: string
): Recipient {
  const phoneNumber = e164PhoneNumber
  let recipient: Recipient

  if (type === TokenTransactionType.EscrowSent) {
    // TODO: Fetch the data from the invite somehow
  }

  if (phoneNumber) {
    // Use the recentTxRecipientCache until the full cache is populated
    recipient = Object.keys(recipientCache).length
      ? recipientCache[phoneNumber]
      : recentTxRecipientsCache[phoneNumber]

    if (recipient) {
      return { ...recipient }
    } else {
      recipient = { e164PhoneNumber: phoneNumber }
      return recipient
    }
  }

  recipient = getRecipientFromAddress(address, recipientInfo, defaultName, defaultImage)

  if (providerInfo) {
    Object.assign(recipient, { name: providerInfo.name, thumbnailPath: providerInfo.icon })
  }
  return recipient
}

export function getTransferFeedParams(
  type: TokenTransactionType,
  t: TFunction,
  phoneRecipientCache: NumberToRecipient,
  recentTxRecipientsCache: NumberToRecipient,
  address: string,
  addressToE164Number: AddressToE164NumberType,
  rawComment: string | null,
  commentKey: string | null,
  timestamp: number,
  recipientInfo: RecipientInfo,
  isCeloRewardSender: boolean,
  isRewardSender: boolean,
  isInviteRewardSender: boolean,
  providerInfo: ProviderFeedInfo | undefined,
  currency: string,
  defaultName?: string,
  defaultImage?: string
) {
  const e164PhoneNumber = addressToE164Number[address]
  const recipient = getRecipient(
    type,
    e164PhoneNumber,
    phoneRecipientCache,
    recentTxRecipientsCache,
    timestamp,
    address,
    recipientInfo,
    providerInfo,
    defaultName,
    defaultImage
  )
  Object.assign(recipient, { address })
  const nameOrNumber =
    recipient?.name || (recipientHasNumber(recipient) ? recipient.e164PhoneNumber : e164PhoneNumber)
  const displayName = getDisplayName(recipient, t)
  const comment = getDecryptedTransferFeedComment(rawComment, commentKey, type)

  let title, info

  switch (type) {
    case TokenTransactionType.VerificationFee: {
      title = t('feedItemVerificationFeeTitle')
      info = t('feedItemVerificationFeeInfo')
      break
    }
    case TokenTransactionType.NetworkFee: {
      title = t('feedItemNetworkFeeTitle')
      info = t('feedItemNetworkFeeInfo')
      break
    }
    case TokenTransactionType.VerificationReward: {
      title = t('feedItemVerificationRewardTitle')
      info = t('feedItemVerificationRewardInfo')
      break
    }
    case TokenTransactionType.Faucet: {
      title = t('feedItemFaucetTitle')
      info = t('feedItemFaucetInfo', {
        context: !DEFAULT_TESTNET ? 'noTestnet' : null,
        faucet: DEFAULT_TESTNET ? _.startCase(DEFAULT_TESTNET) : null,
      })
      break
    }
    case TokenTransactionType.InviteSent: {
      title = t('feedItemInviteSentTitle')
      info = t('feedItemInviteSentInfo', {
        context: !nameOrNumber ? 'noInviteeDetails' : null,
        nameOrNumber,
      })
      break
    }
    case TokenTransactionType.InviteReceived: {
      title = t('feedItemInviteReceivedTitle')
      info = t('feedItemInviteReceivedInfo')
      break
    }
    case TokenTransactionType.Sent: {
      title = t('feedItemSentTitle', { displayName })
      info = t('feedItemSentInfo', { context: !comment ? 'noComment' : null, comment })
      break
    }
    case TokenTransactionType.Received: {
      if (isCeloRewardSender) {
        title = t('feedItemCeloRewardReceivedTitle')
        info = t('feedItemRewardReceivedInfo')
      } else if (isRewardSender) {
        title = t('feedItemRewardReceivedTitle')
        info = t('feedItemRewardReceivedInfo')
        Object.assign(recipient, { thumbnailPath: CELO_LOGO_URL })
      } else if (isInviteRewardSender) {
        title = t('feedItemInviteRewardReceivedTitle')
        info = t('feedItemInviteRewardReceivedInfo')
        Object.assign(recipient, { thumbnailPath: CELO_LOGO_URL })
      } else if (providerInfo) {
        title = t('feedItemReceivedTitle', { displayName })
        switch (currency.toLowerCase()) {
          case 'cusd':
            info = t('cUsdDeposit')
            break
          case 'ceur':
            info = t('cEurDeposit')
            break
          default:
            info = t('celoDeposit')
            break
        }
      } else {
        title = t('feedItemReceivedTitle', { displayName })
        info = t('feedItemReceivedInfo', { context: !comment ? 'noComment' : null, comment })
      }
      break
    }
    case TokenTransactionType.EscrowSent: {
      title = t('feedItemEscrowSentTitle', {
        context: !nameOrNumber ? 'noReceiverDetails' : null,
        nameOrNumber,
      })
      info = t('feedItemEscrowSentInfo', { context: !comment ? 'noComment' : null, comment })
      break
    }
    case TokenTransactionType.EscrowReceived: {
      title = t('feedItemEscrowReceivedTitle', {
        context: !nameOrNumber ? 'noSenderDetails' : null,
        nameOrNumber,
      })
      info = t('feedItemEscrowReceivedInfo', { context: !comment ? 'noComment' : null, comment })
      break
    }
    default: {
      title = t('feedItemGenericTitle', {
        context: !nameOrNumber ? 'noRecipientDetails' : null,
        nameOrNumber,
      })
      // Fallback to just using the type
      info = comment || _.capitalize(t(_.camelCase(type)))
      break
    }
  }
  return { title, info, recipient }
}

// Note: This hook is tested from src/transactions/feed/TransferFeedItem.test.ts
export function useTransactionRecipient(transfer: TokenTransfer) {
  const phoneRecipientCache = useSelector(phoneRecipientCacheSelector)
  const recentTxRecipientsCache = useSelector(recentTxRecipientsCacheSelector)
  const recipientInfo: RecipientInfo = useSelector(recipientInfoSelector)
  const txHashToFeedInfo = useSelector(txHashToFeedInfoSelector)
  const addressToE164Number = useSelector(addressToE164NumberSelector)
  const invitationTransactions = useSelector(inviteTransactionsSelector)
  const identifierToE164Number = useSelector(identifierToE164NumberSelector)

  const phoneNumber =
    transfer.type === TokenTransactionTypeV2.InviteSent &&
    !!invitationTransactions[transfer.transactionHash]
      ? identifierToE164Number[invitationTransactions[transfer.transactionHash].recipientIdentifier]
      : addressToE164Number[transfer.address]

  let recipient: Recipient

  if (phoneNumber) {
    recipient = phoneRecipientCache[phoneNumber] ?? recentTxRecipientsCache[phoneNumber]
    if (recipient) {
      return { ...recipient, address: transfer.address }
    } else {
      recipient = { e164PhoneNumber: phoneNumber, address: transfer.address }
      return recipient
    }
  }

  recipient = getRecipientFromAddress(
    transfer.address,
    recipientInfo,
    transfer.metadata.title,
    transfer.metadata.image
  )

  const providerInfo = txHashToFeedInfo[transfer.transactionHash]
  if (providerInfo) {
    Object.assign(recipient, { name: providerInfo.name, thumbnailPath: providerInfo.icon })
  }
  return recipient
}

// Note: This hook is tested from src/transactions/feed/TransferFeedItem.test.ts
export function useTransferFeedDetails(transfer: FeedTokenTransfer) {
  const { t } = useTranslation()
  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const rewardsSenders = useSelector(rewardsSendersSelector)
  const inviteRewardSenders = useSelector(inviteRewardsSendersSelector)
  const txHashToFeedInfo = useSelector(txHashToFeedInfoSelector)
  const commentKey = useSelector(dataEncryptionKeySelector)
  const tokenInfo = useTokenInfo(transfer.amount.tokenAddress)

  const {
    type,
    address,
    timestamp,
    metadata: { comment: rawComment, subtitle: defaultSubtitle },
  } = transfer

  const recipient = useTransactionRecipient(transfer)

  const nameOrNumber = recipient.name ?? recipient.e164PhoneNumber
  const displayName = getDisplayName(recipient, t)
  const comment =
    getDecryptedTransferFeedComment(rawComment ?? null, commentKey, type) ?? defaultSubtitle

  let title, subtitle

  switch (type) {
    case TokenTransactionTypeV2.Sent: {
      title = t('feedItemSentTitle', { displayName })
      subtitle = t('feedItemSentInfo', { context: !comment ? 'noComment' : null, comment })
      break
    }
    case TokenTransactionTypeV2.Received: {
      // This is for the original CELO rewards program.
      const isCeloRewardSender = addressToDisplayName[address]?.isCeloRewardSender ?? false
      // This is for Supercharge rewards only.
      const isRewardSender = rewardsSenders.includes(address)
      // This is for invite rewards.
      const isInviteRewardSender = inviteRewardSenders.includes(address)
      const providerInfo = txHashToFeedInfo[transfer.transactionHash]

      if (isCeloRewardSender) {
        title = t('feedItemCeloRewardReceivedTitle')
        subtitle = t('feedItemRewardReceivedInfo')
      } else if (isRewardSender) {
        title = t('feedItemRewardReceivedTitle')
        subtitle = t('feedItemRewardReceivedInfo')
        Object.assign(recipient, { thumbnailPath: SUPERCHARGE_LOGO_URL })
      } else if (isInviteRewardSender) {
        title = t('feedItemInviteRewardReceivedTitle')
        subtitle = t('feedItemInviteRewardReceivedInfo')
        Object.assign(recipient, { thumbnailPath: CELO_LOGO_URL })
      } else if (providerInfo) {
        title = t('feedItemReceivedTitle', { displayName })
        subtitle = t('tokenDeposit', { token: tokenInfo?.symbol ?? '' })
      } else {
        title = t('feedItemReceivedTitle', { displayName })
        subtitle = t('feedItemReceivedInfo', { context: !comment ? 'noComment' : null, comment })
      }
      break
    }
    case TokenTransactionTypeV2.InviteSent: {
      title = t('feedItemEscrowSentTitle', {
        context: !nameOrNumber ? 'noReceiverDetails' : null,
        nameOrNumber,
      })
      subtitle = t('feedItemEscrowSentInfo', { context: !comment ? 'noComment' : null, comment })
      break
    }
    case TokenTransactionTypeV2.InviteReceived: {
      title = t('feedItemEscrowReceivedTitle', {
        context: !nameOrNumber ? 'noSenderDetails' : null,
        nameOrNumber,
      })
      subtitle = t('feedItemEscrowReceivedInfo', {
        context: !comment ? 'noComment' : null,
        comment,
      })
      break
    }
    default: {
      title = t('feedItemGenericTitle', {
        context: !nameOrNumber ? 'noRecipientDetails' : null,
        nameOrNumber,
      })
      // Fallback to just using the type
      subtitle = comment || _.capitalize(t(_.camelCase(type)))
      break
    }
  }

  if (transfer.status === TransactionStatus.Pending) {
    subtitle = t('confirmingTransaction')
  }

  const daysSince = timeDeltaInDays(Date.now(), timestamp, true)
  const elapsed = t('daysAgo', { days: daysSince })
  const displayTime =
    daysSince > 0
      ? null
      : new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return { title, subtitle, recipient, elapsed, displayTime }
}

export function getTxsFromUserTxQuery(data?: UserTransactionsQuery) {
  return data?.tokenTransactions?.edges.map((edge) => edge.node).filter(isPresent) ?? []
}

export function getNewTxsFromUserTxQuery(
  data: UserTransactionsQuery | undefined,
  knownFeedTxs: KnownFeedTransactionsType
) {
  const txFragments = getTxsFromUserTxQuery(data)
  return txFragments.filter((tx) => !knownFeedTxs[tx.hash])
}

export function isTokenTxTypeSent(type: TokenTransactionType | TokenTransactionTypeV2) {
  return type === TokenTransactionType.Sent || type === TokenTransactionType.EscrowSent
}

export function isTransferTransaction(
  tx: TransferItemFragment | ExchangeItemFragment
): tx is TransferItemFragment {
  return (tx as TransferItemFragment).address !== undefined
}

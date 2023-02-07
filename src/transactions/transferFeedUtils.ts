import { FiatAccountType, TransferType } from '@fiatconnect/fiatconnect-types'
import BigNumber from 'bignumber.js'
import { TFunction } from 'i18next'
import * as _ from 'lodash'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ExchangeItemFragment,
  TokenTransactionType,
  TransferItemFragment,
  UserTransactionsQuery,
} from 'src/apollo/types'
import { CELO_LOGO_URL, DEFAULT_TESTNET, SUPERCHARGE_LOGO_URL } from 'src/config'
import { FIATCONNECT_CURRENCY_TO_WALLET_CURRENCY } from 'src/fiatconnect/consts'
import {
  cachedFiatAccountUsesSelector,
  getCachedFiatConnectTransferSelector,
} from 'src/fiatconnect/selectors'
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
  coinbasePaySendersSelector,
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
import {
  LocalAmount,
  TokenTransactionTypeV2,
  TokenTransfer,
  TransactionStatus,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { isPresent } from 'src/utils/typescript'
import { dataEncryptionKeySelector } from 'src/web3/selectors'

const TAG = 'transferFeedUtils'

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
export function useTransactionRecipient(transfer: TokenTransfer): Recipient {
  const phoneRecipientCache = useSelector(phoneRecipientCacheSelector)
  const recentTxRecipientsCache = useSelector(recentTxRecipientsCacheSelector)
  const recipientInfo: RecipientInfo = useSelector(recipientInfoSelector)
  const txHashToFeedInfo = useSelector(txHashToFeedInfoSelector)
  const addressToE164Number = useSelector(addressToE164NumberSelector)
  const invitationTransactions = useSelector(inviteTransactionsSelector)
  const identifierToE164Number = useSelector(identifierToE164NumberSelector)
  const fcTransferDisplayInfo = useFiatConnectTransferDisplayInfo(transfer)

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

  if (fcTransferDisplayInfo) {
    return { thumbnailPath: fcTransferDisplayInfo.tokenImageUrl, address: transfer.address }
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
  const coinbasePaySenders = useSelector(coinbasePaySendersSelector)
  const fcTransferDisplayInfo = useFiatConnectTransferDisplayInfo(transfer)

  const {
    type,
    address,
    metadata: { comment: rawComment, subtitle: defaultSubtitle },
  } = transfer

  const recipient = useTransactionRecipient(transfer)

  const nameOrNumber = recipient.name ?? recipient.e164PhoneNumber
  const displayName = getDisplayName(recipient, t)
  const comment =
    getDecryptedTransferFeedComment(rawComment ?? null, commentKey, type) ?? defaultSubtitle

  let title, subtitle, customLocalAmount

  switch (type) {
    case TokenTransactionTypeV2.Sent: {
      if (fcTransferDisplayInfo) {
        ;({ title, subtitle, localAmount: customLocalAmount } = fcTransferDisplayInfo)
      } else {
        title = t('feedItemSentTitle', { displayName })
        subtitle = t('feedItemSentInfo', { context: !comment ? 'noComment' : null, comment })
      }
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
      const isCoinbasePaySender = coinbasePaySenders.includes(address)

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
      } else if (isCoinbasePaySender) {
        title = t('feedItemDepositTitle')
        subtitle = t('feedItemReceivedInfo', { context: !comment ? 'noComment' : null, comment })
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

  return { title, subtitle, recipient, customLocalAmount }
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

// Note: This hook is tested from src/transactions/feed/TransferFeedItem.test.ts
function useFiatConnectTransferDisplayInfo({ amount, transactionHash }: TokenTransfer) {
  const { t } = useTranslation()
  const tokenInfo = useTokenInfo(amount.tokenAddress)
  const fcTransferDetails = useSelector(getCachedFiatConnectTransferSelector(transactionHash))
  const cachedFiatAccountUses = useSelector(cachedFiatAccountUsesSelector)
  const account = useMemo(
    () =>
      fcTransferDetails?.fiatAccountId
        ? cachedFiatAccountUses.find(
            ({ fiatAccountId }) => fiatAccountId === fcTransferDetails.fiatAccountId
          )
        : undefined,
    [cachedFiatAccountUses, fcTransferDetails]
  )
  if (!account || !fcTransferDetails) {
    return
  }
  if (fcTransferDetails.quote.transferType !== TransferType.TransferOut) {
    Logger.debug(TAG, 'useFiatConnectTransferDisplayInfo only supports transfers out (withdraws)')
    return
  }

  const fiatAmount = new BigNumber(fcTransferDetails.quote.fiatAmount)
  const localAmount: LocalAmount = {
    //Negative sign because currently only withdraws are supported
    value: fiatAmount.multipliedBy(-1),
    currencyCode: FIATCONNECT_CURRENCY_TO_WALLET_CURRENCY[fcTransferDetails.quote.fiatType],
    exchangeRate: fiatAmount.div(amount.value).toFixed(2),
  }

  let subtitle: string
  switch (account.fiatAccountType) {
    case FiatAccountType.BankAccount:
      subtitle = t('feedItemFcTransferBankAccount')
      break
    case FiatAccountType.MobileMoney:
      subtitle = t('feedItemFcTransferMobileMoney')
      break
    default:
      Logger.debug(TAG, 'useFiatConnectTransferDisplayInfo received an unsupported FiatAccountType')
      return
  }

  return {
    title: t('feedItemFcTransferWithdraw', { crypto: fcTransferDetails.quote.cryptoType }),
    subtitle,
    tokenImageUrl: tokenInfo?.imageUrl,
    localAmount,
  }
}

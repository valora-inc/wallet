import { FiatAccountType, TransferType } from '@fiatconnect/fiatconnect-types'
import BigNumber from 'bignumber.js'
import * as _ from 'lodash'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CELO_LOGO_URL, SUPERCHARGE_LOGO_URL } from 'src/config'
import { FIATCONNECT_CURRENCY_TO_WALLET_CURRENCY } from 'src/fiatconnect/consts'
import {
  cachedFiatAccountUsesSelector,
  getCachedFiatConnectTransferSelector,
} from 'src/fiatconnect/selectors'
import { txHashToFeedInfoSelector } from 'src/fiatExchanges/reducer'
import { addressToDisplayNameSelector } from 'src/identity/selectors'
import {
  getDisplayName,
  getRecipientFromAddress,
  Recipient,
  RecipientInfo,
  RecipientType,
} from 'src/recipients/recipient'
import {
  coinbasePaySendersSelector,
  inviteRewardsSendersSelector,
  recipientInfoSelector,
  rewardsSendersSelector,
} from 'src/recipients/reducer'
import { useSelector } from 'src/redux/hooks'
import { useTokenInfoByAddress } from 'src/tokens/hooks'
import {
  LocalAmount,
  TokenTransactionTypeV2,
  TokenTransfer,
  TransactionStatus,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'

const TAG = 'transferFeedUtils'

// Note: This hook is tested from src/transactions/feed/TransferFeedItem.test.ts
export function useTransactionRecipient(transfer: TokenTransfer): Recipient {
  const recipientInfo: RecipientInfo = useSelector(recipientInfoSelector)
  const txHashToFeedInfo = useSelector(txHashToFeedInfoSelector)
  const fcTransferDisplayInfo = useFiatConnectTransferDisplayInfo(transfer)

  if (fcTransferDisplayInfo) {
    return {
      thumbnailPath: fcTransferDisplayInfo.tokenImageUrl,
      address: transfer.address,
      recipientType: RecipientType.Address,
    }
  }

  const recipient = getRecipientFromAddress(
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
export function useTransferFeedDetails(transfer: TokenTransfer, isJumpstart: boolean) {
  const { t } = useTranslation()
  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const rewardsSenders = useSelector(rewardsSendersSelector)
  const inviteRewardSenders = useSelector(inviteRewardsSendersSelector)
  const txHashToFeedInfo = useSelector(txHashToFeedInfoSelector)
  const tokenInfo = useTokenInfoByAddress(transfer.amount.tokenAddress)
  const coinbasePaySenders = useSelector(coinbasePaySendersSelector)
  const fcTransferDisplayInfo = useFiatConnectTransferDisplayInfo(transfer)

  const {
    type,
    address,
    metadata: { subtitle: subtitleContent },
  } = transfer

  const recipient = useTransactionRecipient(transfer)

  const nameOrNumber = recipient.name ?? recipient.e164PhoneNumber
  const displayName = getDisplayName(recipient, t)

  let title, subtitle, customLocalAmount

  switch (type) {
    case TokenTransactionTypeV2.Sent: {
      if (fcTransferDisplayInfo) {
        ;({ title, subtitle, localAmount: customLocalAmount } = fcTransferDisplayInfo)
      } else if (isJumpstart) {
        title = t('feedItemJumpstartTitle')
        subtitle = t('feedItemJumpstartSentSubtitle')
      } else {
        title = t('feedItemSentTitle', { displayName })
        subtitle = t('feedItemSentInfo', {
          context: !subtitleContent ? 'noComment' : null,
          subtitleContent,
        })
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
        subtitle = t('feedItemReceivedInfo', {
          context: !subtitleContent ? 'noComment' : null,
          subtitleContent,
        })
      } else if (isJumpstart) {
        title = t('feedItemJumpstartTitle')
        subtitle = t('feedItemJumpstartReceivedSubtitle')
      } else {
        title = t('feedItemReceivedTitle', { displayName })
        subtitle = t('feedItemReceivedInfo', {
          context: !subtitleContent ? 'noComment' : null,
          subtitleContent,
        })
      }
      break
    }
    default: {
      title = t('feedItemGenericTitle', {
        context: !nameOrNumber ? 'noRecipientDetails' : null,
        nameOrNumber,
      })
      // Fallback to just using the type
      subtitle = _.capitalize(t(_.camelCase(type)) ?? undefined)
      break
    }
  }

  if (transfer.status === TransactionStatus.Pending) {
    subtitle = t('confirmingTransaction')
  }

  if (transfer.status === TransactionStatus.Failed) {
    subtitle = t('feedItemFailedTransaction')
  }

  return { title, subtitle, recipient, customLocalAmount }
}

export function isTokenTxTypeSent(type: TokenTransactionTypeV2) {
  return type === TokenTransactionTypeV2.Sent
}

// Note: This hook is tested from src/transactions/feed/TransferFeedItem.test.ts
function useFiatConnectTransferDisplayInfo({ amount, transactionHash }: TokenTransfer) {
  const { t } = useTranslation()
  const tokenInfo = useTokenInfoByAddress(amount.tokenAddress)
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

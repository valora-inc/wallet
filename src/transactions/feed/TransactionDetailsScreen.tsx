import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { addressToDisplayNameSelector } from 'src/identity/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { coinbasePaySendersSelector, rewardsSendersSelector } from 'src/recipients/reducer'
import { useSelector } from 'src/redux/hooks'
import { useTokenInfo } from 'src/tokens/hooks'
import TransactionDetails from 'src/transactions/feed/TransactionDetails'
import {
  EarnClaimContent,
  EarnDepositContent,
  EarnWithdrawContent,
} from 'src/transactions/feed/detailContent/EarnContent'
import TokenApprovalDetails from 'src/transactions/feed/detailContent/TokenApprovalDetails'
import TransferSentContent from 'src/transactions/feed/detailContent/TransferSentContent'
import {
  EarnClaimReward,
  EarnDeposit,
  EarnWithdraw,
  TokenApproval,
  TokenExchange,
  TokenTransaction,
  TokenTransactionTypeV2,
  TokenTransfer,
} from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import networkConfig from 'src/web3/networkConfig'
import RewardReceivedContent from './detailContent/RewardReceivedContent'
import SwapContent from './detailContent/SwapContent'
import TransferReceivedContent from './detailContent/TransferReceivedContent'

type Props = NativeStackScreenProps<StackParamList, Screens.TransactionDetailsScreen>

function useHeaderTitle(transaction: TokenTransaction) {
  const { t } = useTranslation()
  const celoTokenId = useTokenInfo(networkConfig.currencyToTokenId[Currency.Celo])?.tokenId
  const rewardsSenders = useSelector(rewardsSendersSelector)
  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const coinbasePaySenders = useSelector(coinbasePaySendersSelector)

  switch (transaction.type) {
    case TokenTransactionTypeV2.Exchange:
      // TODO: Change this to show any exchanges, not just CELO sell/purchase.
      const isCeloSell = (transaction as TokenExchange).inAmount.tokenId === celoTokenId
      return isCeloSell ? t('soldGold') : t('purchasedGold')
    case TokenTransactionTypeV2.Sent:
      const isCeloSend = (transaction as TokenTransfer).amount.tokenId === celoTokenId
      return isCeloSend ? t('transactionHeaderWithdrewCelo') : t('transactionHeaderSent')
    case TokenTransactionTypeV2.Received:
      const transfer = transaction as TokenTransfer
      const isCeloReception = transfer.amount.tokenId === celoTokenId
      const isCoinbasePaySenders = coinbasePaySenders.includes(transfer.address)
      if (
        rewardsSenders.includes(transfer.address) ||
        addressToDisplayName[transfer.address]?.isCeloRewardSender
      ) {
        return t('transactionHeaderCeloReward')
      } else {
        return isCeloReception || isCoinbasePaySenders
          ? t('transactionHeaderCeloDeposit')
          : t('transactionHeaderReceived')
      }
    case TokenTransactionTypeV2.InviteSent:
      return t('transactionHeaderEscrowSent')
    case TokenTransactionTypeV2.InviteReceived:
      return t('transactionHeaderEscrowReceived')
    case TokenTransactionTypeV2.NftReceived:
      return t('transactionHeaderNftReceived')
    case TokenTransactionTypeV2.NftSent:
      return t('transactionHeaderNftSent')
    case TokenTransactionTypeV2.SwapTransaction:
      return t('swapScreen.title')
    case TokenTransactionTypeV2.Approval:
      return t('transactionFeed.approvalTransactionTitle')
    case TokenTransactionTypeV2.EarnWithdraw:
      return t('earnFlow.transactionFeed.earnWithdrawTitle')
    case TokenTransactionTypeV2.EarnClaimReward:
      return t('earnFlow.transactionFeed.earnClaimTitle')
    case TokenTransactionTypeV2.EarnDeposit:
      return t('earnFlow.transactionFeed.earnDepositTitle')
  }
}

function TransactionDetailsScreen({ route }: Props) {
  const { transaction } = route.params

  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const rewardsSenders = useSelector(rewardsSendersSelector)
  const title = useHeaderTitle(transaction)

  let content
  let retryHandler

  switch (transaction.type) {
    case TokenTransactionTypeV2.Sent:
      const sentTransfer = transaction as TokenTransfer
      retryHandler = () => navigate(Screens.SendSelectRecipient)
      content = <TransferSentContent transfer={sentTransfer} />
      break
    case TokenTransactionTypeV2.InviteSent:
      content = <TransferSentContent transfer={transaction as TokenTransfer} />
      break
    case TokenTransactionTypeV2.Received:
    case TokenTransactionTypeV2.InviteReceived:
      const receivedTransfer = transaction as TokenTransfer
      const isRewardSender =
        rewardsSenders.includes(receivedTransfer.address) ||
        addressToDisplayName[receivedTransfer.address]?.isCeloRewardSender
      if (isRewardSender) {
        content = <RewardReceivedContent transfer={receivedTransfer} />
      } else {
        content = <TransferReceivedContent transfer={receivedTransfer} />
      }
      break
    case TokenTransactionTypeV2.SwapTransaction:
      content = <SwapContent exchange={transaction as TokenExchange} />
      retryHandler = () => navigate(Screens.SwapScreenWithBack)
      break
    case TokenTransactionTypeV2.EarnClaimReward:
      content = <EarnClaimContent transaction={transaction as EarnClaimReward} />
      break
    case TokenTransactionTypeV2.EarnWithdraw:
      content = <EarnWithdrawContent transaction={transaction as EarnWithdraw} />
      break
    case TokenTransactionTypeV2.EarnDeposit:
      content = <EarnDepositContent transaction={transaction as EarnDeposit} />
      break
    case TokenTransactionTypeV2.Approval:
      content = <TokenApprovalDetails transaction={transaction as TokenApproval} />
      break
  }

  return (
    <TransactionDetails transaction={transaction} retryHandler={retryHandler} title={title}>
      {content}
    </TransactionDetails>
  )
}

export default TransactionDetailsScreen

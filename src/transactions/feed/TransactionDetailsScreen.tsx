import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { addressToDisplayNameSelector } from 'src/identity/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { rewardsSendersSelector } from 'src/recipients/reducer'
import { useSelector } from 'src/redux/hooks'
import TransactionDetails from 'src/transactions/feed/TransactionDetails'
import TokenApprovalDetails from 'src/transactions/feed/detailContent/TokenApprovalDetails'
import TransferSentContent from 'src/transactions/feed/detailContent/TransferSentContent'
import {
  TokenApproval,
  TokenExchange,
  TokenTransactionTypeV2,
  TokenTransfer,
} from 'src/transactions/types'
import RewardReceivedContent from './detailContent/RewardReceivedContent'
import SwapContent from './detailContent/SwapContent'
import TransferReceivedContent from './detailContent/TransferReceivedContent'

type Props = NativeStackScreenProps<StackParamList, Screens.TransactionDetailsScreen>

function TransactionDetailsScreen({ route }: Props) {
  const { transaction } = route.params

  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const rewardsSenders = useSelector(rewardsSendersSelector)

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
    case TokenTransactionTypeV2.Approval:
      content = <TokenApprovalDetails transaction={transaction as TokenApproval} />
      break
  }

  return (
    <TransactionDetails transaction={transaction} retryHandler={retryHandler}>
      {content}
    </TransactionDetails>
  )
}

export default TransactionDetailsScreen

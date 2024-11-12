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
import { ClaimRewardContent } from 'src/transactions/feed/detailContent/ClaimRewardContent'
import {
  EarnClaimContent,
  EarnDepositContent,
  EarnWithdrawContent,
} from 'src/transactions/feed/detailContent/EarnContent'
import TokenApprovalDetails from 'src/transactions/feed/detailContent/TokenApprovalDetails'
import TransferSentContent from 'src/transactions/feed/detailContent/TransferSentContent'
import { TokenTransaction, TokenTransactionTypeV2 } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import networkConfig from 'src/web3/networkConfig'
import { DepositOrWithdrawContent } from './detailContent/DepositOrWithdrawContent'
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
      const isCeloSell = transaction.inAmount.tokenId === celoTokenId
      return isCeloSell ? t('soldGold') : t('purchasedGold')
    case TokenTransactionTypeV2.Sent:
      const isCeloSend = transaction.amount.tokenId === celoTokenId
      return isCeloSend ? t('transactionHeaderWithdrewCelo') : t('transactionHeaderSent')
    case TokenTransactionTypeV2.Received:
      const transfer = transaction
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
    case TokenTransactionTypeV2.NftReceived:
      return t('transactionHeaderNftReceived')
    case TokenTransactionTypeV2.NftSent:
      return t('transactionHeaderNftSent')
    case TokenTransactionTypeV2.CrossChainSwapTransaction:
    case TokenTransactionTypeV2.SwapTransaction:
      return t('swapScreen.title')
    case TokenTransactionTypeV2.Approval:
      return t('transactionFeed.approvalTransactionTitle')
    case TokenTransactionTypeV2.Deposit:
      return t('transactionFeed.depositTitle')
    case TokenTransactionTypeV2.Withdraw:
      return t('transactionFeed.withdrawTitle')
    case TokenTransactionTypeV2.ClaimReward:
      return t('transactionFeed.claimRewardTitle')
    case TokenTransactionTypeV2.EarnWithdraw:
      return t('earnFlow.transactionFeed.earnWithdrawTitle')
    case TokenTransactionTypeV2.EarnClaimReward:
      return t('earnFlow.transactionFeed.earnClaimTitle')
    case TokenTransactionTypeV2.EarnSwapDeposit:
    case TokenTransactionTypeV2.EarnDeposit:
      return t('earnFlow.transactionFeed.earnDepositTitle')
  }
}

function TransactionDetailsScreen({ route }: Props) {
  const { transaction } = route.params
  const { t } = useTranslation()

  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const rewardsSenders = useSelector(rewardsSendersSelector)
  const title = useHeaderTitle(transaction)
  const subtitle =
    transaction.type === TokenTransactionTypeV2.CrossChainSwapTransaction
      ? t('transactionFeed.crossChainSwapTransactionLabel')
      : undefined

  let content
  let retryHandler

  switch (transaction.type) {
    case TokenTransactionTypeV2.Sent:
      const sentTransfer = transaction
      retryHandler = () => navigate(Screens.SendSelectRecipient)
      content = <TransferSentContent transfer={sentTransfer} />
      break
    case TokenTransactionTypeV2.Received:
      const receivedTransfer = transaction
      const isRewardSender =
        rewardsSenders.includes(receivedTransfer.address) ||
        addressToDisplayName[receivedTransfer.address]?.isCeloRewardSender
      if (isRewardSender) {
        content = <RewardReceivedContent transfer={receivedTransfer} />
      } else {
        content = <TransferReceivedContent transfer={receivedTransfer} />
      }
      break
    case TokenTransactionTypeV2.CrossChainSwapTransaction:
    case TokenTransactionTypeV2.SwapTransaction:
      content = <SwapContent transaction={transaction} />
      retryHandler = () => navigate(Screens.SwapScreenWithBack)
      break
    case TokenTransactionTypeV2.Deposit:
    case TokenTransactionTypeV2.Withdraw:
      content = <DepositOrWithdrawContent transaction={transaction} />
      break
    case TokenTransactionTypeV2.ClaimReward:
      content = <ClaimRewardContent transaction={transaction} />
      break
    case TokenTransactionTypeV2.EarnClaimReward:
      content = <EarnClaimContent transaction={transaction} />
      break
    case TokenTransactionTypeV2.EarnWithdraw:
      content = <EarnWithdrawContent transaction={transaction} />
      break
    case TokenTransactionTypeV2.EarnDeposit:
      content = <EarnDepositContent transaction={transaction} />
      break
    case TokenTransactionTypeV2.EarnSwapDeposit:
      content = <EarnDepositContent transaction={transaction} />
      break
    case TokenTransactionTypeV2.Approval:
      content = <TokenApprovalDetails transaction={transaction} />
      break
  }

  return (
    <TransactionDetails
      transaction={transaction}
      retryHandler={retryHandler}
      title={title}
      subtitle={subtitle}
    >
      {content}
    </TransactionDetails>
  )
}

export default TransactionDetailsScreen

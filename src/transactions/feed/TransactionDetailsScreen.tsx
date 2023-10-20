import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import i18n from 'src/i18n'
import { addressToDisplayNameSelector } from 'src/identity/selectors'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { coinbasePaySendersSelector, rewardsSendersSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import TransactionDetailsPill from 'src/transactions/feed/TransactionDetailsPill'
import TransactionStatusInfo from 'src/transactions/feed/TransactionStatusInfo'
import TransferSentContent from 'src/transactions/feed/detailContent/TransferSentContent'
import {
  TokenExchange,
  TokenTransaction,
  TokenTransactionTypeV2,
  TokenTransfer,
} from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { getDatetimeDisplayString } from 'src/utils/time'
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
  }
}

function TransactionDetailsScreen({ navigation, route }: Props) {
  const { transaction } = route.params

  const title = useHeaderTitle(transaction)
  const dateTime = getDatetimeDisplayString(transaction.timestamp, i18n)

  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const rewardsSenders = useSelector(rewardsSendersSelector)

  let content
  let retryHandler

  switch (transaction.type) {
    case TokenTransactionTypeV2.Sent:
    case TokenTransactionTypeV2.InviteSent:
      retryHandler = () => console.log('TODO RETRY SEND')
      content = <TransferSentContent transfer={transaction as TokenTransfer} />
      break
    case TokenTransactionTypeV2.Received:
    case TokenTransactionTypeV2.InviteReceived:
      const transfer = transaction as TokenTransfer
      const isRewardSender =
        rewardsSenders.includes(transfer.address) ||
        addressToDisplayName[transfer.address]?.isCeloRewardSender
      content = isRewardSender ? (
        <RewardReceivedContent transfer={transfer} />
      ) : (
        <TransferReceivedContent transfer={transfer} />
      )
      break
    case TokenTransactionTypeV2.SwapTransaction:
      content = <SwapContent exchange={transaction as TokenExchange} />
      retryHandler = () => console.log('TODO RETRY SWAP')
      break
  }

  const transactionNetwork = networkConfig.networkIdToNetwork[transaction.networkId]
  const onShowTransactionDetails = transactionNetwork
    ? () => {
        // TODO: add anaytics? e.g.:
        // ValoraAnalytics.track(SwapEvents.swap_feed_detail_view_tx)

        navigation.navigate(Screens.WebViewScreen, {
          uri: `${networkConfig.blockExplorerBaseTxUrl[transactionNetwork]}${transaction.transactionHash}`,
        })
      }
    : undefined

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.dateTime}>{dateTime}</Text>
      <View style={styles.status}>
        <TransactionStatusInfo status={transaction.status} />
        <TransactionDetailsPill
          status={transaction.status}
          onShowDetails={onShowTransactionDetails}
          onRetry={retryHandler}
        />
      </View>
      <View style={styles.content}>{content}</View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: Spacing.Regular16,
    paddingHorizontal: Spacing.Thick24,
  },
  content: {
    marginTop: Spacing.Large32,
  },
  title: {
    ...typeScale.titleSmall,
    color: colors.dark,
  },
  dateTime: {
    ...typeScale.bodyXSmall,
    color: colors.gray3,
    marginTop: 2,
  },
  status: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 42,
    marginTop: 8,
  },
})

export default TransactionDetailsScreen

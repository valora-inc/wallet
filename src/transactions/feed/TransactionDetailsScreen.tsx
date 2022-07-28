import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import i18n from 'src/i18n'
import { addressToDisplayNameSelector } from 'src/identity/selectors'
import { HeaderTitleWithSubtitle } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { rewardsSendersSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { tokensByCurrencySelector } from 'src/tokens/selectors'
import TransferSentContent from 'src/transactions/feed/detailContent/TransferSentContent'
import {
  TokenExchange,
  TokenTransaction,
  TokenTransactionTypeV2,
  TokenTransfer,
} from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { getDatetimeDisplayString } from 'src/utils/time'
import CeloExchangeContent from './detailContent/CeloExchangeContent'
import RewardReceivedContent from './detailContent/RewardReceivedContent'
import TransferReceivedContent from './detailContent/TransferReceivedContent'

type Props = StackScreenProps<StackParamList, Screens.TransactionDetailsScreen>

function useHeaderTitle(transaction: TokenTransaction) {
  const { t } = useTranslation()
  const tokensByCurrency = useSelector(tokensByCurrencySelector)
  const celoAddress = tokensByCurrency[Currency.Celo]?.address
  const rewardsSenders = useSelector(rewardsSendersSelector)
  const addressToDisplayName = useSelector(addressToDisplayNameSelector)

  switch (transaction.type) {
    case TokenTransactionTypeV2.Exchange:
      // TODO: Change this to show any exchanges, not just CELO sell/purchase.
      const isCeloSell = (transaction as TokenExchange).inAmount.tokenAddress === celoAddress
      return isCeloSell ? t('soldGold') : t('purchasedGold')
    case TokenTransactionTypeV2.Sent:
      const isCeloSend = (transaction as TokenTransfer).amount.tokenAddress === celoAddress
      return isCeloSend ? t('transactionHeaderWithdrewCelo') : t('transactionHeaderSent')
    case TokenTransactionTypeV2.Received:
      const transfer = transaction as TokenTransfer
      const isCeloReception = transfer.amount.tokenAddress === celoAddress
      if (
        rewardsSenders.includes(transfer.address) ||
        addressToDisplayName[transfer.address]?.isCeloRewardSender
      ) {
        return t('transactionHeaderCeloReward')
      } else {
        return isCeloReception ? t('transactionHeaderCeloDeposit') : t('transactionHeaderReceived')
      }
    case TokenTransactionTypeV2.InviteSent:
      return t('transactionHeaderEscrowSent')
    case TokenTransactionTypeV2.InviteReceived:
      return t('transactionHeaderEscrowReceived')
  }
}

function TransactionDetailsScreen({ navigation, route }: Props) {
  const { transaction } = route.params

  const headerTitle = useHeaderTitle(transaction)
  useLayoutEffect(() => {
    const dateTimeStatus = getDatetimeDisplayString(transaction.timestamp, i18n)
    navigation.setOptions({
      headerTitle: () => <HeaderTitleWithSubtitle title={headerTitle} subTitle={dateTimeStatus} />,
    })
  }, [transaction])

  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const rewardsSenders = useSelector(rewardsSendersSelector)

  let content

  switch (transaction.type) {
    case TokenTransactionTypeV2.Exchange:
      content = <CeloExchangeContent exchange={transaction as TokenExchange} />
      break
    case TokenTransactionTypeV2.Sent:
    case TokenTransactionTypeV2.InviteSent:
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
  }

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <SafeAreaView style={styles.content}>{content}</SafeAreaView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
})

export default TransactionDetailsScreen

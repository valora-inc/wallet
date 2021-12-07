import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
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

type Props = StackScreenProps<StackParamList, Screens.TransactionDetailsScreen>

function useHeaderTitle(transaction: TokenTransaction) {
  const { t } = useTranslation()
  const tokensByCurrency = useSelector(tokensByCurrencySelector)
  const celoAddress = tokensByCurrency[Currency.Celo]?.address
  const rewardsSenders = useSelector(rewardsSendersSelector)
  const addressToDisplayName = useSelector(addressToDisplayNameSelector)

  switch (transaction.type) {
    case TokenTransactionTypeV2.Exchange:
      // TODO: Change this to show actual exchanges.
      const isCeloSell = (transaction as TokenExchange).inAmount.tokenAddress === celoAddress
      return isCeloSell ? i18n.t('soldGold') : i18n.t('purchasedGold')
    case TokenTransactionTypeV2.Sent:
      const isCeloSend = (transaction as TokenTransfer).amount.tokenAddress === celoAddress
      return t(isCeloSend ? 'transactionHeaderWithdrewCelo' : 'transactionHeaderSent')
    case TokenTransactionTypeV2.Received:
      const transfer = transaction as TokenTransfer
      const isCeloReception = transfer.amount.tokenAddress === celoAddress
      if (
        rewardsSenders.includes(transfer.address) ||
        addressToDisplayName[transfer.address]?.isCeloRewardSender
      ) {
        return t('transactionHeaderCeloReward')
      } else {
        return isCeloReception
          ? i18n.t('transactionHeaderCeloDeposit')
          : i18n.t('transactionHeaderReceived')
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

  let content

  switch (transaction.type) {
    case TokenTransactionTypeV2.Exchange:
      // TODO:
      content = null
      break
    case TokenTransactionTypeV2.Sent:
      content = <TransferSentContent transfer={transaction as TokenTransfer} />
      break
    case TokenTransactionTypeV2.Received:
    case TokenTransactionTypeV2.InviteSent:
    case TokenTransactionTypeV2.InviteReceived:
      content = null
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
  learnMore: {
    ...fontStyles.small,
    color: colors.gray4,
    textDecorationLine: 'underline',
  },
})

export default TransactionDetailsScreen

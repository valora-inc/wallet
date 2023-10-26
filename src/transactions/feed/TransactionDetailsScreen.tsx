import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TransactionDetailsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import RowDivider from 'src/components/RowDivider'
import Touchable from 'src/components/Touchable'
import i18n from 'src/i18n'
import ArrowRight from 'src/icons/ArrowRight'
import { addressToDisplayNameSelector } from 'src/identity/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { coinbasePaySendersSelector, rewardsSendersSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import TransactionPrimaryAction from 'src/transactions/feed/TransactionPrimaryAction'
import TransactionStatusIndicator from 'src/transactions/feed/TransactionStatusIndicator'
import TransferSentContent from 'src/transactions/feed/detailContent/TransferSentContent'
import {
  Network,
  NetworkId,
  TokenExchange,
  TokenTransaction,
  TokenTransactionTypeV2,
  TokenTransfer,
  TransactionStatus,
} from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { getDatetimeDisplayString } from 'src/utils/time'
import networkConfig, { blockExplorerUrls, networkIdToNetwork } from 'src/web3/networkConfig'
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

  const { t } = useTranslation()

  const title = useHeaderTitle(transaction)
  const dateTime = getDatetimeDisplayString(transaction.timestamp, i18n)

  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const rewardsSenders = useSelector(rewardsSendersSelector)

  let content
  let retryHandler

  switch (transaction.type) {
    case TokenTransactionTypeV2.Sent:
      retryHandler = () => navigate(Screens.Send)
      content = <TransferSentContent transfer={transaction as TokenTransfer} />
      break
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
    case TokenTransactionTypeV2.SwapTransaction:
      content = <SwapContent exchange={transaction as TokenExchange} />
      retryHandler = () => navigate(Screens.SwapScreenWithBack)
      break
  }

  const transactionNetwork = networkIdToNetwork[transaction.networkId]

  const openBlockExplorerHandler =
    transaction.networkId in NetworkId
      ? () =>
          navigate(Screens.WebViewScreen, {
            uri: new URL(
              transaction.transactionHash,
              blockExplorerUrls[transaction.networkId].baseTxUrl
            ).toString(),
          })
      : undefined

  const primaryActionHanlder =
    transaction.status === TransactionStatus.Failed ? retryHandler : openBlockExplorerHandler

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SafeAreaView edges={['bottom']}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.dateTime}>{dateTime}</Text>
        <View style={styles.status}>
          <TransactionStatusIndicator status={transaction.status} />
          {primaryActionHanlder && (
            <TransactionPrimaryAction
              status={transaction.status}
              type={transaction.type}
              onPress={primaryActionHanlder}
              testID="transactionDetails/primaryAction"
            />
          )}
        </View>
        <View style={styles.content}>{content}</View>
        {openBlockExplorerHandler && (
          <>
            <RowDivider />
            <Touchable
              style={styles.rowContainer}
              borderless={true}
              onPress={() => {
                ValoraAnalytics.track(
                  TransactionDetailsEvents.transaction_details_tap_block_explorer,
                  {
                    transactionType: transaction.type,
                    transactionStatus: transaction.status,
                  }
                )
                openBlockExplorerHandler()
              }}
              testID="transactionDetails/blockExplorerLink"
            >
              <>
                <Text style={styles.blockExplorerLink}>
                  {transactionNetwork === Network.Celo && t('viewOnCeloBlockExplorer')}
                  {transactionNetwork === Network.Ethereum && t('viewOnEthereumBlockExplorer')}
                </Text>
                <ArrowRight color={Colors.gray3} size={16} />
              </>
            </Touchable>
          </>
        )}
      </SafeAreaView>
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
    color: Colors.dark,
  },
  dateTime: {
    ...typeScale.bodyXSmall,
    color: Colors.gray3,
    marginTop: 2,
  },
  status: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 42,
    marginTop: Spacing.Smallest8,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockExplorerLink: {
    ...typeScale.bodyXSmall,
    color: Colors.gray3,
    marginRight: Spacing.Tiny4,
  },
})

export default TransactionDetailsScreen

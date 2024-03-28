import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TransactionDetailsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import RowDivider from 'src/components/RowDivider'
import Touchable from 'src/components/Touchable'
import i18n from 'src/i18n'
import ArrowRightThick from 'src/icons/ArrowRightThick'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import TransactionPrimaryAction from 'src/transactions/feed/TransactionPrimaryAction'
import TransactionStatusIndicator from 'src/transactions/feed/TransactionStatusIndicator'
import { NetworkId, TokenTransaction, TransactionStatus } from 'src/transactions/types'
import { getDatetimeDisplayString } from 'src/utils/time'
import { blockExplorerUrls } from 'src/web3/networkConfig'

type Props = {
  transaction: TokenTransaction
  title?: string
  children?: React.ReactNode
  retryHandler?: () => void
}

function TransactionDetails({ transaction, title, children, retryHandler }: Props) {
  const { t } = useTranslation()

  const dateTime = getDatetimeDisplayString(transaction.timestamp, i18n)

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

  const networkIdToExplorerString: Record<NetworkId, string> = {
    [NetworkId['celo-mainnet']]: t('viewOnCeloScan'),
    [NetworkId['celo-alfajores']]: t('viewOnCeloScan'),
    [NetworkId['ethereum-mainnet']]: t('viewOnEthereumBlockExplorer'),
    [NetworkId['ethereum-sepolia']]: t('viewOnEthereumBlockExplorer'),
    [NetworkId['arbitrum-one']]: t('viewOnArbiscan'),
    [NetworkId['arbitrum-sepolia']]: t('viewOnArbiscan'),
    [NetworkId['op-mainnet']]: t('viewOnOPMainnetExplorer'),
    [NetworkId['op-sepolia']]: t('viewOnOPSepoliaExplorer'),
    [NetworkId['polygon-pos-mainnet']]: t('viewOnPolygonPoSScan'),
    [NetworkId['polygon-pos-mumbai']]: t('viewOnPolygonPoSScan'),
    [NetworkId['base-mainnet']]: t('viewOnBaseScan'),
    [NetworkId['base-sepolia']]: t('viewOnBaseScan'),
  }

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
        <View style={styles.content}>{children}</View>
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
              <View style={styles.rowContainer}>
                <Text style={styles.blockExplorerLink}>
                  {networkIdToExplorerString[transaction.networkId]}
                </Text>
                <ArrowRightThick size={16} />
              </View>
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
    color: Colors.black,
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

export default TransactionDetails

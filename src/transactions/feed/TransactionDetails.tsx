import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { TransactionDetailsEvents } from 'src/analytics/Events'
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
import {
  NetworkId,
  TokenTransaction,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import { getDatetimeDisplayString } from 'src/utils/time'
import networkConfig, { blockExplorerUrls } from 'src/web3/networkConfig'

type Props = {
  transaction: TokenTransaction
  title?: string
  subtitle?: string
  children?: React.ReactNode
  retryHandler?: () => void
}

function TransactionDetails({ transaction, title, subtitle, children, retryHandler }: Props) {
  const { t } = useTranslation()

  const dateTime = getDatetimeDisplayString(transaction.timestamp, i18n)
  // If a cross chain swap transaction fails on the source network, the cross
  // chain explorer will not know about it because the cross chain swap has not
  // been initiated. Therefore for failed cross chain swaps, we should show the
  // transaction in the default network explorer.
  const showCrossChainSwapExplorer =
    transaction.type === TokenTransactionTypeV2.CrossChainSwapTransaction &&
    transaction.status !== TransactionStatus.Failed

  const openBlockExplorerHandler =
    transaction.networkId in NetworkId || showCrossChainSwapExplorer
      ? () => {
          const explorerUrl = showCrossChainSwapExplorer
            ? networkConfig.crossChainExplorerUrl
            : blockExplorerUrls[transaction.networkId].baseTxUrl
          navigate(Screens.WebViewScreen, {
            uri: new URL(transaction.transactionHash, explorerUrl).toString(),
          })
          AppAnalytics.track(TransactionDetailsEvents.transaction_details_tap_block_explorer, {
            transactionType: transaction.type,
            transactionStatus: transaction.status,
          })
        }
      : undefined

  const primaryActionHandler =
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
    [NetworkId['polygon-pos-amoy']]: t('viewOnPolygonPoSScan'),
    [NetworkId['base-mainnet']]: t('viewOnBaseScan'),
    [NetworkId['base-sepolia']]: t('viewOnBaseScan'),
  }

  const explorerName = showCrossChainSwapExplorer
    ? t('viewOnAxelarScan')
    : networkIdToExplorerString[transaction.networkId]

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SafeAreaView edges={['bottom']}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <Text style={styles.subtitle}>{dateTime}</Text>
        <View style={styles.status}>
          <TransactionStatusIndicator status={transaction.status} />
          {primaryActionHandler && (
            <TransactionPrimaryAction
              status={transaction.status}
              type={transaction.type}
              onPress={primaryActionHandler}
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
              onPress={openBlockExplorerHandler}
              testID="transactionDetails/blockExplorerLink"
            >
              <View style={styles.rowContainer}>
                <Text style={styles.blockExplorerLink}>{explorerName}</Text>
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
  subtitle: {
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

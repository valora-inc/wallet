import BigNumber from 'bignumber.js'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { hideHomeBalancesSelector } from 'src/app/selectors'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { jumpstartReclaimFlowStarted } from 'src/jumpstart/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import TransactionFeedItemImage from 'src/transactions/feed/TransactionFeedItemImage'
import { useTransferFeedDetails } from 'src/transactions/transferFeedUtils'
import { TokenTransfer } from 'src/transactions/types'
import { isPresent } from 'src/utils/typescript'
interface Props {
  transfer: TokenTransfer
}

function TransferFeedItem({ transfer }: Props) {
  const dispatch = useDispatch()
  const { amount } = transfer
  const isJumpstart = isJumpstartTransaction(transfer)

  const openTransferDetails = () => {
    if (isJumpstart) {
      dispatch(jumpstartReclaimFlowStarted())
      navigate(Screens.JumpstartTransactionDetailsScreen, { transaction: transfer })
    } else {
      navigate(Screens.TransactionDetailsScreen, { transaction: transfer })
    }

    ValoraAnalytics.track(HomeEvents.transaction_feed_item_select)
  }

  const tokenInfo = useTokenInfo(amount.tokenId)
  const showTokenAmount = !amount.localAmount && !tokenInfo?.priceUsd

  const { title, subtitle, recipient, customLocalAmount } = useTransferFeedDetails(
    transfer,
    isJumpstart
  )

  const colorStyle = new BigNumber(amount.value).isPositive() ? { color: colors.primary } : {}

  const hideHomeBalanceState = useSelector(hideHomeBalancesSelector)

  return (
    <Touchable testID="TransferFeedItem" onPress={openTransferDetails}>
      <View style={styles.container}>
        <TransactionFeedItemImage
          recipient={recipient}
          status={transfer.status}
          transactionType={transfer.__typename}
          isJumpstart={isJumpstart}
          networkId={transfer.networkId}
        />
        <View style={styles.contentContainer}>
          <Text style={styles.title} testID={'TransferFeedItem/title'} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} testID={'TransferFeedItem/subtitle'} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {!hideHomeBalanceState && (
          <View style={styles.amountContainer}>
            <TokenDisplay
              amount={amount.value}
              tokenId={amount.tokenId}
              localAmount={customLocalAmount ?? amount.localAmount}
              showExplicitPositiveSign={true}
              showLocalAmount={!showTokenAmount}
              style={[styles.amount, colorStyle]}
              testID={'TransferFeedItem/amount'}
            />
            <TokenDisplay
              amount={amount.value}
              tokenId={amount.tokenId}
              showLocalAmount={false}
              showSymbol={true}
              hideSign={true}
              style={[styles.tokenAmount, { opacity: showTokenAmount ? 0 : 1 }]}
              testID={'TransferFeedItem/tokenAmount'}
            />
          </View>
        )}
      </View>
    </Touchable>
  )
}

function isJumpstartTransaction(tx: TokenTransfer) {
  const jumpstartConfig = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.WALLET_JUMPSTART_CONFIG]
  ).jumpstartContracts[tx.networkId]
  const jumpstartAddresses = [
    jumpstartConfig?.contractAddress,
    ...(jumpstartConfig?.retiredContractAddresses ?? []),
  ].filter(isPresent)

  return jumpstartAddresses.includes(tx.address)
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: Spacing.Small12,
    paddingHorizontal: variables.contentPadding,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: variables.contentPadding,
  },
  amountContainer: {
    maxWidth: '50%',
  },
  title: {
    ...typeScale.labelMedium,
  },
  subtitle: {
    ...typeScale.bodySmall,
    color: colors.gray4,
  },
  amount: {
    ...typeScale.labelMedium,
    color: colors.black,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
  tokenAmount: {
    ...typeScale.bodySmall,
    color: colors.gray4,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
})

export default TransferFeedItem

import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React, { useEffect } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { DappShortcutsEvents } from 'src/analytics/Events'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import DataFieldWithCopy from 'src/components/DataFieldWithCopy'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { triggeredShortcutsStatusSelector } from 'src/positions/selectors'
import { RawShortcutTransaction, denyExecuteShortcut, executeShortcut } from 'src/positions/slice'
import { rawShortcutTransactionsToTransactionRequests } from 'src/positions/transactions'
import { useDispatch, useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { prepareTransactions } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransaction } from 'src/viem/preparedTransactionSerialization'
import DappsDisclaimer from 'src/walletConnect/screens/DappsDisclaimer'
import EstimatedNetworkFee from 'src/walletConnect/screens/EstimatedNetworkFee'
import RequestContent from 'src/walletConnect/screens/RequestContent'
import networkConfig from 'src/web3/networkConfig'
import { BaseError } from 'viem'

const TAG = 'src/dapps/DappShortcutTransactionRequest'

function usePrepareShortcutTransactions(
  networkId: NetworkId,
  rawTransactions: RawShortcutTransaction[] | undefined
) {
  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, networkId))

  return useAsync(
    async () => {
      if (!rawTransactions?.length) {
        return undefined
      }
      Logger.debug(
        TAG + '@usePrepareShortcutTransactions',
        'Received transactions',
        rawTransactions
      )
      return prepareTransactions({
        feeCurrencies,
        decreasedAmountGasFeeMultiplier: 1,
        baseTransactions: rawShortcutTransactionsToTransactionRequests(rawTransactions),
        origin: 'shortcut' as const,
      })
    },
    [networkId, rawTransactions],
    {
      onError: (err) => {
        Logger.warn(TAG + '@usePrepareShortcutTransactions', 'Failed to prepare transaction', err)
      },
    }
  )
}

type Props = BottomSheetScreenProps<StackParamList, Screens.DappShortcutTransactionRequest>

// TODO: the content here is very similar to the one in ActionRequest.tsx for WalletConnect
// there's an opportunity to refactor this into a shared component
function DappShortcutTransactionRequest({ route: { params } }: Props) {
  const { rewardId } = params

  return (
    <BottomSheetScrollView>
      <Content rewardId={rewardId} />
    </BottomSheetScrollView>
  )
}

function Content({ rewardId }: { rewardId: string }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const triggeredShortcuts = useSelector(triggeredShortcutsStatusSelector)
  const pendingAcceptShortcut = triggeredShortcuts[rewardId]
  const networkId = pendingAcceptShortcut?.networkId ?? networkConfig.defaultNetworkId
  const trackedShortcutProperties = {
    rewardId,
    appName: pendingAcceptShortcut?.appName ?? '',
    appId: pendingAcceptShortcut?.appId ?? '',
    network: networkId,
    shortcutId: pendingAcceptShortcut?.shortcutId ?? '',
  }

  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, networkId))

  const asyncPreparedTransactions = usePrepareShortcutTransactions(
    networkId,
    pendingAcceptShortcut?.transactions
  )

  useEffect(() => {
    AppAnalytics.track(
      DappShortcutsEvents.dapp_shortcuts_reward_tx_propose,
      trackedShortcutProperties
    )
  }, [])

  const handleClaimReward = () => {
    if (!pendingAcceptShortcut || asyncPreparedTransactions.result?.type !== 'possible') {
      // should never happen
      Logger.error(TAG + '@handleClaimReward', 'No in progress reward found when claiming reward')
      return
    }

    dispatch(
      executeShortcut({
        id: rewardId,
        preparedTransactions: asyncPreparedTransactions.result.transactions.map(
          getSerializablePreparedTransaction
        ),
      })
    )
    AppAnalytics.track(
      DappShortcutsEvents.dapp_shortcuts_reward_tx_accepted,
      trackedShortcutProperties
    )
  }

  const handleDenyTransaction = () => {
    if (pendingAcceptShortcut) {
      dispatch(denyExecuteShortcut(rewardId))

      AppAnalytics.track(
        DappShortcutsEvents.dapp_shortcuts_reward_tx_rejected,
        trackedShortcutProperties
      )
    }
  }

  const handleTrackCopyTransactionDetails = () => {
    if (pendingAcceptShortcut) {
      AppAnalytics.track(
        DappShortcutsEvents.dapp_shortcuts_reward_tx_copy,
        trackedShortcutProperties
      )
    }
  }

  if (!pendingAcceptShortcut?.transactions?.length) {
    return (
      <ActivityIndicator
        testID="DappShortcutTransactionRequest/Loading"
        color={Colors.accent}
        style={styles.loader}
      />
    )
  }

  const { result: preparedTransactionsResult, error } = asyncPreparedTransactions
  const dappName = pendingAcceptShortcut.appName
  const dappImageUrl = pendingAcceptShortcut.appImage
  const title = t('confirmTransaction')
  const description = t('walletConnectRequest.sendTransaction', {
    dappName,
  })
  const testId = 'DappShortcutTransactionRequest/Content'

  if (error) {
    return (
      <RequestContent
        type="dismiss"
        onDismiss={handleDenyTransaction}
        dappName={dappName}
        dappImageUrl={dappImageUrl}
        title={title}
        description={description}
        testId={testId}
      >
        <DataFieldWithCopy
          label={t('walletConnectRequest.transactionDataLabel')}
          value={JSON.stringify(pendingAcceptShortcut.transactions)}
          copySuccessMessage={t('walletConnectRequest.transactionDataCopied')}
          testID="DappShortcutTransactionRequest/RewardTransactionData"
          onCopy={handleTrackCopyTransactionDetails}
        />
        <InLineNotification
          variant={NotificationVariant.Warning}
          title={t('walletConnectRequest.failedToPrepareTransaction.title')}
          description={t('walletConnectRequest.failedToPrepareTransaction.description', {
            // Viem has short user-friendly error messages
            errorMessage: error instanceof BaseError ? error.shortMessage : error.message,
          })}
          style={styles.warning}
        />
      </RequestContent>
    )
  }

  if (
    preparedTransactionsResult?.type === 'not-enough-balance-for-gas' ||
    // Treat this one as the same as not-enough-balance-for-gas
    // Though it can't happen in the context of shortcuts, since we don't know the spend amount
    preparedTransactionsResult?.type === 'need-decrease-spend-amount-for-gas'
  ) {
    return (
      <RequestContent
        type="dismiss"
        onDismiss={handleDenyTransaction}
        dappName={dappName}
        dappImageUrl={dappImageUrl}
        title={title}
        description={description}
        testId={testId}
      >
        <InLineNotification
          variant={NotificationVariant.Warning}
          title={t('walletConnectRequest.notEnoughBalanceForGas.title')}
          description={t('walletConnectRequest.notEnoughBalanceForGas.description', {
            feeCurrencies: feeCurrencies.map((token) => token.symbol).join(', '),
          })}
          style={styles.warning}
        />
      </RequestContent>
    )
  }

  const serializablePreparedTransactions = preparedTransactionsResult?.transactions.map(
    getSerializablePreparedTransaction
  )
  const isLoading = asyncPreparedTransactions.loading || !serializablePreparedTransactions

  return (
    <RequestContent
      type="confirm"
      onAccept={handleClaimReward}
      onDeny={handleDenyTransaction}
      dappName={dappName}
      dappImageUrl={dappImageUrl}
      title={title}
      description={description}
      buttonLoading={isLoading}
      testId={testId}
    >
      <DataFieldWithCopy
        label={t('walletConnectRequest.transactionDataLabel')}
        // Fallback to string with single space to avoid layout changes once the data is loaded
        value={JSON.stringify(serializablePreparedTransactions) ?? ' '}
        copySuccessMessage={t('walletConnectRequest.transactionDataCopied')}
        testID="DappShortcutTransactionRequest/RewardTransactionData"
        onCopy={handleTrackCopyTransactionDetails}
      />
      <EstimatedNetworkFee
        isLoading={isLoading}
        networkId={networkId}
        transactions={serializablePreparedTransactions ?? []}
      />
      <DappsDisclaimer isDappListed={true} />
    </RequestContent>
  )
}

const styles = StyleSheet.create({
  loader: {
    marginVertical: Spacing.Thick24,
  },
  warning: {
    marginBottom: Spacing.Thick24,
  },
})

export default DappShortcutTransactionRequest

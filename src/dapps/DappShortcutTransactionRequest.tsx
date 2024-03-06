import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet } from 'react-native'
import { DappShortcutsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import DataFieldWithCopy from 'src/components/DataFieldWithCopy'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { triggeredShortcutsStatusSelector } from 'src/positions/selectors'
import { denyExecuteShortcut, executeShortcut } from 'src/positions/slice'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { Colors } from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import DappsDisclaimer from 'src/walletConnect/screens/DappsDisclaimer'
import RequestContent from 'src/walletConnect/screens/RequestContent'

type Props = BottomSheetScreenProps<StackParamList, Screens.DappShortcutTransactionRequest>

function DappShortcutTransactionRequest({ route: { params } }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const { rewardId } = params

  const triggeredShortcuts = useSelector(triggeredShortcutsStatusSelector)
  const pendingAcceptShortcut = triggeredShortcuts[rewardId]
  const trackedShortcutProperties = {
    rewardId,
    appName: pendingAcceptShortcut?.appName ?? '',
    appId: pendingAcceptShortcut?.appId ?? '',
    network: pendingAcceptShortcut?.network ?? '',
    shortcutId: pendingAcceptShortcut?.shortcutId ?? '',
  }

  useEffect(() => {
    ValoraAnalytics.track(
      DappShortcutsEvents.dapp_shortcuts_reward_tx_propose,
      trackedShortcutProperties
    )
  }, [])

  const handleClaimReward = () => {
    if (!pendingAcceptShortcut) {
      // should never happen
      Logger.error('dapps/DappShortcutsRewards', 'No in progress reward found when claiming reward')
      return
    }

    dispatch(executeShortcut(rewardId))
    ValoraAnalytics.track(
      DappShortcutsEvents.dapp_shortcuts_reward_tx_accepted,
      trackedShortcutProperties
    )
  }

  const handleDenyTransaction = () => {
    if (pendingAcceptShortcut) {
      dispatch(denyExecuteShortcut(rewardId))

      ValoraAnalytics.track(
        DappShortcutsEvents.dapp_shortcuts_reward_tx_rejected,
        trackedShortcutProperties
      )
    }
  }

  const handleTrackCopyTransactionDetails = () => {
    if (pendingAcceptShortcut) {
      ValoraAnalytics.track(
        DappShortcutsEvents.dapp_shortcuts_reward_tx_copy,
        trackedShortcutProperties
      )
    }
  }

  return (
    <BottomSheetScrollView>
      {pendingAcceptShortcut?.transactions?.length ? (
        <RequestContent
          type="confirm"
          onAccept={handleClaimReward}
          onDeny={handleDenyTransaction}
          dappName={pendingAcceptShortcut.appName}
          dappImageUrl={pendingAcceptShortcut.appImage}
          title={t('confirmTransaction')}
          description={t('walletConnectRequest.sendTransaction', {
            dappName: pendingAcceptShortcut.appName,
          })}
          testId="DappShortcutTransactionRequest/BottomSheet"
        >
          <DataFieldWithCopy
            label={t('walletConnectRequest.transactionDataLabel')}
            value={JSON.stringify(pendingAcceptShortcut.transactions)}
            copySuccessMessage={t('walletConnectRequest.transactionDataCopied')}
            testID="DappShortcutTransactionRequest/RewardTransactionData"
            onCopy={handleTrackCopyTransactionDetails}
          />
          <DappsDisclaimer isDappListed={true} />
        </RequestContent>
      ) : (
        <ActivityIndicator
          testID="DappShortcutTransactionRequest/Loading"
          color={Colors.primary}
          style={styles.loader}
        />
      )}
    </BottomSheetScrollView>
  )
}

const styles = StyleSheet.create({
  loader: {
    marginVertical: Spacing.Thick24,
  },
})

export default DappShortcutTransactionRequest

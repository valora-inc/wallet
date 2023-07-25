import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import DataFieldWithCopy from 'src/components/DataFieldWithCopy'
import { BottomSheetParams } from 'src/navigator/types'
import { pendingAcceptanceShortcutSelector } from 'src/positions/selectors'
import {
  denyExecuteShortcut,
  executeShortcut,
  executeShortcutBackgrounded,
} from 'src/positions/slice'
import { Colors } from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import DappsDisclaimer from 'src/walletConnect/screens/DappsDisclaimer'
import RequestContent from 'src/walletConnect/screens/RequestContent'

function DappShortcutTransactionRequest({ handleContentLayout }: BottomSheetParams) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const pendingAcceptShortcut = useSelector(pendingAcceptanceShortcutSelector)
  const inFlightShortcutRef = useRef(pendingAcceptShortcut)

  useEffect(() => {
    inFlightShortcutRef.current = pendingAcceptShortcut
  }, [pendingAcceptShortcut])

  useEffect(() => {
    return () => {
      if (inFlightShortcutRef.current?.status === 'accepting') {
        dispatch(executeShortcutBackgrounded(inFlightShortcutRef.current.id))
      }
    }
  }, [])

  const handleClaimReward = () => {
    if (!pendingAcceptShortcut) {
      // should never happen
      Logger.error('dapps/DappShortcutsRewards', 'No in progress reward found when claiming reward')
      return
    }

    dispatch(executeShortcut(pendingAcceptShortcut.id))
  }

  const handleDenyTransaction = () => {
    if (pendingAcceptShortcut) {
      dispatch(denyExecuteShortcut(pendingAcceptShortcut.id))
    }
  }

  const handleTrackCopyTransactionDetails = () => {
    // TODO
  }

  return (
    <BottomSheetScrollView handleContentLayout={handleContentLayout}>
      {pendingAcceptShortcut?.transactions?.length ? (
        <RequestContent
          onAccept={handleClaimReward}
          onDeny={handleDenyTransaction}
          dappName={pendingAcceptShortcut.appName}
          dappImageUrl={pendingAcceptShortcut.appImage}
          title={t('confirmTransaction')}
          // TODO update translation keys
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
          color={Colors.greenBrand}
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

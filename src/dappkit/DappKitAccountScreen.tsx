import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet } from 'react-native'
import { SafeAreaView, useSafeAreaFrame } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { DappKitEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { approveAccountAuth, getDefaultRequestTrackedProperties } from 'src/dappkit/dappkit'
import { activeDappSelector, dappConnectInfoSelector } from 'src/dapps/selectors'
import { DappConnectInfo } from 'src/dapps/types'
import { BOTTOM_SHEET_DEFAULT_HANDLE_HEIGHT } from 'src/navigator/constants'
import { isBottomSheetVisible, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { BottomSheetParams, StackParamList } from 'src/navigator/types'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import RequestContent from 'src/walletConnect/screens/RequestContent'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'dappkit/DappKitAccountScreen'

type Props = BottomSheetScreenProps<StackParamList, Screens.DappKitAccountScreen> &
  BottomSheetParams

const DappKitAccountScreen = ({ route, handleContentLayout }: Props) => {
  const { dappKitRequest } = route.params

  const [scrollEnabled, setScrollEnabled] = useState(false)
  const { height } = useSafeAreaFrame()

  const account = useSelector(currentAccountSelector)
  const phoneNumber = useSelector(e164NumberSelector)
  const activeDapp = useSelector(activeDappSelector)
  const dappConnectInfo = useSelector(dappConnectInfoSelector)

  const dispatch = useDispatch()
  const { t } = useTranslation()

  const handleAllow = () => {
    if (!dappKitRequest) {
      Logger.error(TAG, 'No request found in navigation props')
      return
    }
    if (!account) {
      Logger.error(TAG, 'No account set up for this wallet')
      return
    }
    SentryTransactionHub.startTransaction(SentryTransaction.dappkit_connection)
    dispatch(approveAccountAuth(dappKitRequest))
  }

  const handleCancel = async () => {
    ValoraAnalytics.track(
      DappKitEvents.dappkit_request_cancel,
      getDefaultRequestTrackedProperties(route.params.dappKitRequest, activeDapp)
    )
    if (await isBottomSheetVisible(Screens.DappKitAccountScreen)) {
      navigateBack()
    }
  }

  const handleLayout = (event: LayoutChangeEvent) => {
    handleContentLayout(event)
    if (event.nativeEvent.layout.height >= height) {
      setScrollEnabled(true)
    }
  }

  return (
    <BottomSheetScrollView
      style={{ maxHeight: height - BOTTOM_SHEET_DEFAULT_HANDLE_HEIGHT }}
      scrollEnabled={scrollEnabled}
    >
      <SafeAreaView edges={['bottom']} style={styles.container} onLayout={handleLayout}>
        <RequestContent
          onAccept={handleAllow}
          onDeny={handleCancel}
          dappImageUrl={dappConnectInfo === DappConnectInfo.Basic ? activeDapp?.iconUrl : undefined}
          dappName={dappKitRequest.dappName}
          title={
            dappConnectInfo === DappConnectInfo.Basic
              ? t('connectToWallet', { dappName: dappKitRequest.dappName })
              : t('confirmTransaction')
          }
          description={phoneNumber ? t('connectWalletInfoDappkit') : t('shareInfo')}
          requestDetails={[
            {
              label: t('phoneNumber'),
              value: phoneNumber,
            },
            {
              label: t('address'),
              value: account,
            },
          ]}
          testId="DappKitSessionRequest"
        />
      </SafeAreaView>
    </BottomSheetScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Thick24,
  },
})

export default DappKitAccountScreen

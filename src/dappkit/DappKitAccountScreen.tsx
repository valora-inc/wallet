import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { DappKitEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { approveAccountAuth, getDefaultRequestTrackedProperties } from 'src/dappkit/dappkit'
import { activeDappSelector, dappConnectInfoSelector } from 'src/dapps/selectors'
import { DappConnectInfo } from 'src/dapps/types'
import { isBottomSheetVisible, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import RequestContent from 'src/walletConnect/screens/RequestContent'
import useDynamicBottomSheetHeight from 'src/walletConnect/screens/useDynamicBottomSheetHeight'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'dappkit/DappKitAccountScreen'

type Props = BottomSheetScreenProps<StackParamList, Screens.DappKitAccountScreen>

const DappKitAccountScreen = ({ route, navigation }: Props) => {
  const { dappKitRequest } = route.params

  const account = useSelector(currentAccountSelector)
  const phoneNumber = useSelector(e164NumberSelector)
  const activeDapp = useSelector(activeDappSelector)
  const dappConnectInfo = useSelector(dappConnectInfoSelector)
  const { handleContentLayout } = useDynamicBottomSheetHeight(navigation)

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

  return (
    <SafeAreaView edges={['bottom']} style={styles.container} onLayout={handleContentLayout}>
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
        dappUrl={dappKitRequest.callback}
        testId="DappKitSessionRequest"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Thick24,
  },
})

export default DappKitAccountScreen

import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { DappKitEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Expandable from 'src/components/Expandable'
import Touchable from 'src/components/Touchable'
import { getDefaultRequestTrackedProperties, requestTxSignature } from 'src/dappkit/dappkit'
import { activeDappSelector, dappConnectInfoSelector } from 'src/dapps/selectors'
import { DappConnectInfo } from 'src/dapps/types'
import { isBottomSheetVisible, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import RequestContent from 'src/walletConnect/screens/RequestContent'
import useDynamicBottomSheetHeight from 'src/walletConnect/screens/useDynamicBottomSheetHeight'

const TAG = 'dappkit/DappKitSignTxScreen'

type Props = BottomSheetScreenProps<StackParamList, Screens.DappKitSignTxScreen>

const DappKitSignTxScreen = ({ route, navigation }: Props) => {
  const { dappKitRequest } = route.params
  const { dappName, txs, callback } = dappKitRequest

  const activeDapp = useSelector(activeDappSelector)
  const dappConnectInfo = useSelector(dappConnectInfoSelector)

  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { handleContentLayout } = useDynamicBottomSheetHeight(navigation)

  const [showTransactionDetails, setShowTransactionDetails] = useState(false)

  if (!dappKitRequest) {
    Logger.error(TAG, 'No request found in navigation props')
    return null
  }

  const handleAllow = () => {
    dispatch(requestTxSignature(dappKitRequest))
  }

  const handleShowTransactionDetails = () => {
    ValoraAnalytics.track(
      DappKitEvents.dappkit_request_details,
      getDefaultRequestTrackedProperties(dappKitRequest, activeDapp)
    )
    setShowTransactionDetails((prev) => !prev)
  }

  const handleCancel = async () => {
    ValoraAnalytics.track(
      DappKitEvents.dappkit_request_cancel,
      getDefaultRequestTrackedProperties(dappKitRequest, activeDapp)
    )
    if (await isBottomSheetVisible(Screens.DappKitSignTxScreen)) {
      navigateBack()
    }
  }

  const requestDetails = [
    {
      label: t('action.operation'),
      value: t('transaction.signTX'),
    },
  ]

  return (
    <SafeAreaView edges={['bottom']} style={styles.container} onLayout={handleContentLayout}>
      <RequestContent
        onAccept={handleAllow}
        onDeny={handleCancel}
        dappName={dappName}
        dappImageUrl={dappConnectInfo === DappConnectInfo.Basic ? activeDapp?.iconUrl : undefined}
        title={t('confirmTransaction', { dappName })}
        description={t('action.askingV1_35', { dappName })}
        testId="DappKitSignRequest"
        dappUrl={callback}
        requestDetails={requestDetails}
      >
        <Touchable testID="ShowTransactionDetailsButton" onPress={handleShowTransactionDetails}>
          <Expandable isExpandable isExpanded={showTransactionDetails}>
            <Text style={[styles.bodyText, styles.underLine]}>{t('action.details')}</Text>
          </Expandable>
        </Touchable>

        {showTransactionDetails && (
          <Text testID="DappData" style={styles.bodyText}>
            {txs[0].txData}
          </Text>
        )}
      </RequestContent>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Thick24,
    flex: 1,
    alignItems: 'center',
  },
  bodyText: {
    ...fontStyles.small,
    color: colors.gray4,
    marginBottom: Spacing.Smallest8,
  },
  underLine: {
    textDecorationLine: 'underline',
  },
})

export default DappKitSignTxScreen

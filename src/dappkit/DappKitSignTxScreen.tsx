import Clipboard from '@react-native-clipboard/clipboard'
import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-simple-toast'
import { useDispatch, useSelector } from 'react-redux'
import { DappKitEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import Touchable from 'src/components/Touchable'
import { getDefaultRequestTrackedProperties, requestTxSignature } from 'src/dappkit/dappkit'
import { activeDappSelector } from 'src/dapps/selectors'
import CopyIcon from 'src/icons/CopyIcon'
import { isBottomSheetVisible, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import DappsDisclaimer from 'src/walletConnect/screens/DappsDisclaimer'
import RequestContent from 'src/walletConnect/screens/RequestContent'
import { useIsDappListed } from 'src/walletConnect/screens/useIsDappListed'

const TAG = 'dappkit/DappKitSignTxScreen'

type Props = BottomSheetScreenProps<StackParamList, Screens.DappKitSignTxScreen>

const DappKitSignTxScreen = ({ route }: Props) => {
  const { dappKitRequest } = route.params
  const { dappName, txs, callback } = dappKitRequest

  const activeDapp = useSelector(activeDappSelector)
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const isDappListed = useIsDappListed(callback)

  if (!dappKitRequest) {
    Logger.error(TAG, 'No request found in navigation props')
    return null
  }

  const handleAllow = () => {
    dispatch(requestTxSignature(dappKitRequest))
  }

  const handleCopyRequestPayload = () => {
    Clipboard.setString(txs[0].txData)
    vibrateInformative()
    ValoraAnalytics.track(
      DappKitEvents.dappkit_copy_request_details,
      getDefaultRequestTrackedProperties(dappKitRequest, activeDapp)
    )
    Toast.showWithGravity(
      t('walletConnectRequest.transactionDataCopied'),
      Toast.SHORT,
      Toast.BOTTOM
    )
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

  return (
    <BottomSheetScrollView>
      <RequestContent
        type="confirm"
        onAccept={handleAllow}
        onDeny={handleCancel}
        dappName={dappName}
        dappImageUrl={activeDapp?.iconUrl}
        title={t('confirmTransaction')}
        description={t('walletConnectRequest.signTransaction', { dappName })}
        testId="DappKitSignRequest"
      >
        <View style={styles.transactionContainer}>
          <View style={styles.transactionDataContainer}>
            <Text style={styles.transactionDataLabel}>
              {t('walletConnectRequest.transactionDataLabel')}
            </Text>
            <Text testID="DappData" style={fontStyles.small} numberOfLines={1} ellipsizeMode="tail">
              {txs[0].txData}
            </Text>
          </View>
          <Touchable hitSlop={variables.iconHitslop} onPress={handleCopyRequestPayload}>
            <CopyIcon />
          </Touchable>
        </View>

        <DappsDisclaimer isDappListed={isDappListed} />
      </RequestContent>
    </BottomSheetScrollView>
  )
}

const styles = StyleSheet.create({
  transactionContainer: {
    padding: Spacing.Regular16,
    backgroundColor: colors.gray1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: Spacing.Thick24,
  },
  transactionDataContainer: {
    flex: 1,
    marginRight: Spacing.Regular16,
  },
  transactionDataLabel: {
    ...fontStyles.small600,
    marginBottom: 4,
  },
})

export default DappKitSignTxScreen

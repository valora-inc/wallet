import { StackScreenProps } from '@react-navigation/stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { DappKitEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { activeDappSelector } from 'src/app/selectors'
import Expandable from 'src/components/Expandable'
import Touchable from 'src/components/Touchable'
import { getDefaultRequestTrackedProperties, requestTxSignature } from 'src/dappkit/dappkit'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import RequestContent from 'src/walletConnect/screens/RequestContent'

const TAG = 'dappkit/DappKitSignTxScreen'

type Props = StackScreenProps<StackParamList, Screens.DappKitSignTxScreen>

const DappKitSignTxScreen = ({ route }: Props) => {
  const activeDapp = useSelector(activeDappSelector)
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const [showTransactionDetails, setShowTransactionDetails] = useState(false)

  const { dappKitRequest } = route.params

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

  const handleCancel = () => {
    ValoraAnalytics.track(
      DappKitEvents.dappkit_request_cancel,
      getDefaultRequestTrackedProperties(dappKitRequest, activeDapp)
    )
    navigateBack()
  }

  const { dappName, txs } = dappKitRequest
  const requestDetails = [
    {
      label: t('action.operation'),
      value: t('transaction.signTX'),
    },
  ]

  return (
    <View style={styles.container}>
      <RequestContent
        onAccept={handleAllow}
        onDeny={handleCancel}
        dappImageUrl={activeDapp?.iconUrl}
        title={t('confirmTransaction', { dappName })}
        description={t('action.askingV1_35', { dappName })}
        testId="DappKitSignRequest"
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
    </View>
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

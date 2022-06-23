import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { DappKitEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { approveAccountAuth, getDefaultRequestTrackedProperties } from 'src/dappkit/dappkit'
import { activeDappSelector } from 'src/dapps/selectors'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import RequestContent from 'src/walletConnect/screens/RequestContent'
import { useIsDappListed } from 'src/walletConnect/screens/useIsDappListed'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'dappkit/DappKitAccountScreen'

type Props = StackScreenProps<StackParamList, Screens.DappKitAccountScreen>

const DappKitAccountScreen = ({ route }: Props) => {
  const { dappKitRequest } = route.params

  const account = useSelector(currentAccountSelector)
  const phoneNumber = useSelector(e164NumberSelector)
  const activeDapp = useSelector(activeDappSelector)
  const isDappListed = useIsDappListed(dappKitRequest.callback)
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
    dispatch(approveAccountAuth(dappKitRequest))
  }

  const handleCancel = () => {
    ValoraAnalytics.track(
      DappKitEvents.dappkit_request_cancel,
      getDefaultRequestTrackedProperties(route.params.dappKitRequest, activeDapp)
    )
    navigateBack()
  }

  return (
    <View style={styles.container}>
      <RequestContent
        onAccept={handleAllow}
        onDeny={handleCancel}
        dappImageUrl={activeDapp?.iconUrl}
        title={t('connectToWallet', { dappName: dappKitRequest.dappName })}
        description={t('shareInfo')}
        requestDetails={[
          {
            label: t('phoneNumber'),
            value: phoneNumber,
          },
          {
            label: t('address'),
            value: account,
            tapToCopy: true,
          },
        ]}
        isDappListed={isDappListed}
        testId="DappKitSessionRequest"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Thick24,
    flex: 1,
    alignItems: 'center',
  },
})

export default DappKitAccountScreen

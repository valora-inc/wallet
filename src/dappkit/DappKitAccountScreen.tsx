import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { DappKitEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import { approveAccountAuth, getDefaultRequestTrackedProperties } from 'src/dappkit/dappkit'
import { activeDappSelector } from 'src/dapps/selectors'
import { isBottomSheetVisible, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import Logger from 'src/utils/Logger'
import RequestContent from 'src/walletConnect/screens/RequestContent'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'dappkit/DappKitAccountScreen'

type Props = BottomSheetScreenProps<StackParamList, Screens.DappKitAccountScreen>

const DappKitAccountScreen = ({ route }: Props) => {
  const { dappKitRequest } = route.params

  const account = useSelector(currentAccountSelector)
  const phoneNumber = useSelector(e164NumberSelector)
  const activeDapp = useSelector(activeDappSelector)

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
    <BottomSheetScrollView>
      <RequestContent
        type="confirm"
        onAccept={handleAllow}
        onDeny={handleCancel}
        dappImageUrl={activeDapp?.iconUrl}
        dappName={dappKitRequest.dappName}
        title={t('connectToWallet', { dappName: dappKitRequest.dappName })}
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
    </BottomSheetScrollView>
  )
}

export default DappKitAccountScreen

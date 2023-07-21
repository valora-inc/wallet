import { trimLeading0x } from '@celo/utils/lib/address'
import { IWalletConnectSession } from '@walletconnect/legacy-types'
import { SessionTypes, SignClientTypes } from '@walletconnect/types'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { WalletConnectEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import DataFieldWithCopy from 'src/components/DataFieldWithCopy'
import { activeDappSelector } from 'src/dapps/selectors'
import {
  getDefaultRequestTrackedPropertiesV1,
  getDefaultRequestTrackedPropertiesV2,
  getDefaultSessionTrackedPropertiesV1,
  getDefaultSessionTrackedPropertiesV2,
} from 'src/walletConnect/analytics'
import { SupportedActions } from 'src/walletConnect/constants'
import { WalletConnectPayloadRequest } from 'src/walletConnect/types'

type Props =
  | {
      walletConnectVersion: 1
      session: IWalletConnectSession
      request: WalletConnectPayloadRequest
    }
  | {
      walletConnectVersion: 2
      session: SessionTypes.Struct
      request: SignClientTypes.EventArguments['session_request']
    }

function ActionRequestPayload(props: Props) {
  const { method, params } =
    props.walletConnectVersion === 1 ? props.request : props.request.params.request

  const { t } = useTranslation()
  const activeDapp = useSelector(activeDappSelector)

  const moreInfoString = useMemo(
    () =>
      method === SupportedActions.eth_signTransaction ||
      method === SupportedActions.eth_sendTransaction
        ? JSON.stringify(params)
        : method === SupportedActions.eth_signTypedData ||
          method === SupportedActions.eth_signTypedData_v4
        ? JSON.stringify(params[1])
        : method === SupportedActions.personal_decrypt
        ? Buffer.from(params[1]).toString('hex')
        : method === SupportedActions.personal_sign
        ? Buffer.from(trimLeading0x(params[0]), 'hex').toString() ||
          params[0] ||
          t('action.emptyMessage')
        : null,
    [method, params]
  )

  const handleTrackCopyRequestPayload = () => {
    const defaultTrackedProps =
      props.walletConnectVersion === 1
        ? {
            ...getDefaultSessionTrackedPropertiesV1(props.session, activeDapp),
            ...getDefaultRequestTrackedPropertiesV1(props.request, props.session.chainId),
          }
        : {
            ...getDefaultSessionTrackedPropertiesV2(props.session, activeDapp),
            ...getDefaultRequestTrackedPropertiesV2(props.request),
          }
    ValoraAnalytics.track(WalletConnectEvents.wc_copy_request_payload, defaultTrackedProps)
  }

  if (!moreInfoString) {
    return null
  }

  return (
    <DataFieldWithCopy
      label={t('walletConnectRequest.transactionDataLabel')}
      value={moreInfoString}
      testID="WalletConnectRequest/ActionRequestPayload"
      onCopy={handleTrackCopyRequestPayload}
    />
  )
}

export default ActionRequestPayload

import { trimLeading0x } from '@celo/utils/lib/address'
import { SessionTypes } from '@walletconnect/types'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { WalletConnectEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import DataFieldWithCopy from 'src/components/DataFieldWithCopy'
import { activeDappSelector } from 'src/dapps/selectors'
import { useSelector } from 'src/redux/hooks'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import {
  getDefaultRequestTrackedProperties,
  getDefaultSessionTrackedProperties,
} from 'src/walletConnect/analytics'
import { SupportedActions } from 'src/walletConnect/constants'

type Props = {
  session: SessionTypes.Struct
  request: Web3WalletTypes.EventArguments['session_request']
  preparedTransaction?: SerializableTransactionRequest
}

function ActionRequestPayload(props: Props) {
  const { method, params } = props.request.params.request

  const { t } = useTranslation()
  const activeDapp = useSelector(activeDappSelector)

  const moreInfoString = useMemo(
    () =>
      method === SupportedActions.eth_signTransaction ||
      method === SupportedActions.eth_sendTransaction
        ? JSON.stringify(props.preparedTransaction ?? params)
        : method === SupportedActions.eth_signTypedData ||
            method === SupportedActions.eth_signTypedData_v4
          ? JSON.stringify(params[1])
          : method === SupportedActions.personal_sign
            ? Buffer.from(trimLeading0x(params[0]), 'hex').toString() ||
              params[0] ||
              t('action.emptyMessage')
            : null,
    [method, params, props.preparedTransaction]
  )

  const handleTrackCopyRequestPayload = () => {
    const defaultTrackedProps = {
      ...getDefaultSessionTrackedProperties(props.session, activeDapp),
      ...getDefaultRequestTrackedProperties(props.request),
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
      copySuccessMessage={t('walletConnectRequest.transactionDataCopied')}
      testID="WalletConnectRequest/ActionRequestPayload"
      onCopy={handleTrackCopyRequestPayload}
    />
  )
}

export default ActionRequestPayload

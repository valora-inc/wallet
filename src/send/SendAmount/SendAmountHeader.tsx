import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'react-native'
import { RequestEvents, SendEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import CustomHeader from 'src/components/header/CustomHeader'
import { HeaderTitleWithTokenBalance, styles as headerStyles } from 'src/navigator/Headers'
import TokenPickerSelector from 'src/send/SendAmount/TokenPickerSelector'
import variables from 'src/styles/variables'
import { useTokenInfo, useTokensForSend } from 'src/tokens/hooks'

interface Props {
  tokenId: string
  isOutgoingPaymentRequest: boolean
  onOpenCurrencyPicker: () => void
  disallowCurrencyChange: boolean
}

function SendAmountHeader({
  tokenId,
  isOutgoingPaymentRequest,
  onOpenCurrencyPicker,
  disallowCurrencyChange,
}: Props) {
  const { t } = useTranslation()
  const tokensForSend = useTokensForSend()
  const tokenInfo = useTokenInfo(tokenId)

  const backButtonEventName = isOutgoingPaymentRequest
    ? RequestEvents.request_amount_back
    : SendEvents.send_amount_back

  const canChangeToken =
    (tokensForSend.length >= 2 || isOutgoingPaymentRequest) && !disallowCurrencyChange

  const title = useMemo(() => {
    let titleText
    let title
    if (!canChangeToken) {
      titleText = t('sendToken', { token: tokenInfo?.symbol })
      title = titleText
    } else if (isOutgoingPaymentRequest) {
      titleText = t('request')
      title = titleText
    } else {
      titleText = t('send')
      title = t('send')
    }
    return isOutgoingPaymentRequest ? (
      <Text style={headerStyles.headerTitle}>{titleText}</Text>
    ) : (
      <HeaderTitleWithTokenBalance
        title={title}
        tokenInfo={tokenInfo}
        showLocalAmount={!!tokenInfo?.priceUsd}
      />
    )
  }, [isOutgoingPaymentRequest, tokenInfo])

  return (
    <CustomHeader
      style={{ paddingLeft: variables.contentPadding }}
      left={<BackButton eventName={backButtonEventName} />}
      title={title}
      right={
        canChangeToken && (
          <TokenPickerSelector tokenId={tokenId} onChangeToken={onOpenCurrencyPicker} />
        )
      }
    />
  )
}

export default SendAmountHeader

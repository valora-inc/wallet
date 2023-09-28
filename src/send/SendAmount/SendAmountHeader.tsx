import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'react-native'
import { RequestEvents, SendEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import CustomHeader from 'src/components/header/CustomHeader'
import { styles as headerStyles, HeaderTitleWithTokenBalance } from 'src/navigator/Headers'
import useSelector from 'src/redux/useSelector'
import TokenPickerSelector from 'src/send/SendAmount/TokenPickerSelector'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import { tokensWithTokenBalanceSelector } from 'src/tokens/selectors'

interface Props {
  tokenAddress: string
  isOutgoingPaymentRequest: boolean
  onOpenCurrencyPicker: () => void
  disallowCurrencyChange: boolean
}

function SendAmountHeader({
  tokenAddress,
  isOutgoingPaymentRequest,
  onOpenCurrencyPicker,
  disallowCurrencyChange,
}: Props) {
  const { t } = useTranslation()
  const tokensWithBalance = useSelector(tokensWithTokenBalanceSelector)
  const tokenInfo = useTokenInfo(tokenAddress)

  const backButtonEventName = isOutgoingPaymentRequest
    ? RequestEvents.request_amount_back
    : SendEvents.send_amount_back

  const canChangeToken =
    (tokensWithBalance.length >= 2 || isOutgoingPaymentRequest) && !disallowCurrencyChange

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
          <TokenPickerSelector tokenAddress={tokenAddress} onChangeToken={onOpenCurrencyPicker} />
        )
      }
    />
  )
}

export default SendAmountHeader

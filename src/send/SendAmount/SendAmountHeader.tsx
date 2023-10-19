import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SendEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import CustomHeader from 'src/components/header/CustomHeader'
import { HeaderTitleWithTokenBalance } from 'src/navigator/Headers'
import TokenPickerSelector from 'src/send/SendAmount/TokenPickerSelector'
import variables from 'src/styles/variables'
import { useTokenInfo, useTokensForSend } from 'src/tokens/hooks'

interface Props {
  tokenId: string
  onOpenCurrencyPicker: () => void
  disallowCurrencyChange: boolean
}

function SendAmountHeader({ tokenId, onOpenCurrencyPicker, disallowCurrencyChange }: Props) {
  const { t } = useTranslation()
  const tokensForSend = useTokensForSend()
  const tokenInfo = useTokenInfo(tokenId)

  const backButtonEventName = SendEvents.send_amount_back

  const canChangeToken = tokensForSend.length >= 2 && !disallowCurrencyChange

  const title = useMemo(() => {
    const title = canChangeToken ? t('send') : t('sendToken', { token: tokenInfo?.symbol })

    return (
      <HeaderTitleWithTokenBalance
        title={title}
        tokenInfo={tokenInfo}
        showLocalAmount={!!tokenInfo?.priceUsd}
      />
    )
  }, [tokenInfo])

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

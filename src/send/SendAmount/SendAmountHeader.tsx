import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SendEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import CustomHeader from 'src/components/header/CustomHeader'
import { HeaderTitleWithTokenBalance } from 'src/navigator/Headers'
import useSelector from 'src/redux/useSelector'
import TokenPickerSelector from 'src/send/SendAmount/TokenPickerSelector'
import variables from 'src/styles/variables'
import { useTokenInfoByAddress } from 'src/tokens/hooks'
import { tokensWithTokenBalanceAndAddressSelector } from 'src/tokens/selectors'

interface Props {
  tokenAddress: string
  onOpenCurrencyPicker: () => void
  disallowCurrencyChange: boolean
}

function SendAmountHeader({ tokenAddress, onOpenCurrencyPicker, disallowCurrencyChange }: Props) {
  const { t } = useTranslation()
  const tokensWithBalance = useSelector(tokensWithTokenBalanceAndAddressSelector)
  const tokenInfo = useTokenInfoByAddress(tokenAddress)

  const backButtonEventName = SendEvents.send_amount_back

  const canChangeToken = tokensWithBalance.length >= 2 && !disallowCurrencyChange

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
          <TokenPickerSelector tokenAddress={tokenAddress} onChangeToken={onOpenCurrencyPicker} />
        )
      }
    />
  )
}

export default SendAmountHeader

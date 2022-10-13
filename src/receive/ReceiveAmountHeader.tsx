import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { RequestEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import CustomHeader from 'src/components/header/CustomHeader'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import { styles as headerStyles } from 'src/navigator/Headers'
import useSelector from 'src/redux/useSelector'
import TokenPickerSelector from 'src/send/SendAmount/TokenPickerSelector'
import { useTokenInfo } from 'src/tokens/hooks'
import { tokensWithTokenBalanceSelector } from 'src/tokens/selectors'

interface Props {
  tokenAddress: string
  onChangeToken: (token: string) => void
  disallowCurrencyChange: boolean
}

function ReceiveAmountHeader({ tokenAddress, onChangeToken, disallowCurrencyChange }: Props) {
  const { t } = useTranslation()
  const [showingCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const tokensWithBalance = useSelector(tokensWithTokenBalanceSelector)
  const tokenInfo = useTokenInfo(tokenAddress)
  const tokenList = tokensWithBalance

  const onTokenSelected = (token: string) => {
    setShowCurrencyPicker(false)
    onChangeToken(token)
  }

  const openCurrencyPicker = () => setShowCurrencyPicker(true)
  const closeCurrencyPicker = () => setShowCurrencyPicker(false)

  const backButtonEventName = RequestEvents.request_amount_back

  const canChangeToken = tokenList.length >= 2

  const title = useMemo(() => {
    const titleText = t('request')
    return <Text style={headerStyles.headerTitle}>{titleText}</Text>
  }, [tokenInfo])

  return (
    <>
      <CustomHeader
        left={<BackButton eventName={backButtonEventName} />}
        title={title}
        right={
          canChangeToken && (
            <TokenPickerSelector tokenAddress={tokenAddress} onChangeToken={openCurrencyPicker} />
          )
        }
      />
      <TokenBottomSheet
        isOutgoingPaymentRequest={false}
        isInvite={false}
        isVisible={showingCurrencyPicker}
        origin={TokenPickerOrigin.Receive}
        onTokenSelected={onTokenSelected}
        onClose={closeCurrencyPicker}
      />
    </>
  )
}

export default ReceiveAmountHeader

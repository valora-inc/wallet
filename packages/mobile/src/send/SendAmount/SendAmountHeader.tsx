import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { RequestEvents, SendEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import CustomHeader from 'src/components/header/CustomHeader'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import { HeaderTitleWithTokenBalance, styles as headerStyles } from 'src/navigator/Headers'
import useSelector from 'src/redux/useSelector'
import TokenPickerSelector from 'src/send/SendAmount/TokenPickerSelector'
import { useTokenInfo } from 'src/tokens/hooks'
import { stablecoinsSelector, tokensWithTokenBalanceSelector } from 'src/tokens/selectors'

interface Props {
  tokenAddress: string
  isOutgoingPaymentRequest: boolean
  isInvite: boolean
  onChangeToken: (token: string) => void
  disallowCurrencyChange: boolean
}

function SendAmountHeader({
  tokenAddress,
  isOutgoingPaymentRequest,
  isInvite,
  onChangeToken,
  disallowCurrencyChange,
}: Props) {
  const { t } = useTranslation()
  const [showingCurrencyPicker, setShowCurrencyPicker] = useState(false)
  const tokensWithBalance = useSelector(tokensWithTokenBalanceSelector)
  const inviteTokens = useSelector(stablecoinsSelector)
  const tokenInfo = useTokenInfo(tokenAddress)
  const tokenList = isInvite ? inviteTokens : tokensWithBalance

  const onTokenSelected = (token: string) => {
    setShowCurrencyPicker(false)
    onChangeToken(token)
  }

  const openCurrencyPicker = () => setShowCurrencyPicker(true)
  const closeCurrencyPicker = () => setShowCurrencyPicker(false)

  const backButtonEventName = isOutgoingPaymentRequest
    ? RequestEvents.request_amount_back
    : SendEvents.send_amount_back

  const canChangeToken =
    (tokenList.length >= 2 || isOutgoingPaymentRequest) && !disallowCurrencyChange

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
      title = (
        <View style={styles.titleContainer} testID="HeaderCurrencyPicker">
          <Text style={headerStyles.headerTitle}>{titleText}</Text>
        </View>
      )
    }
    return isOutgoingPaymentRequest ? (
      <Text style={headerStyles.headerTitle}>{titleText}</Text>
    ) : (
      <HeaderTitleWithTokenBalance title={title} token={tokenInfo!.address} />
    )
  }, [isOutgoingPaymentRequest, tokenInfo])

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
        isOutgoingPaymentRequest={isOutgoingPaymentRequest}
        isInvite={isInvite}
        isVisible={showingCurrencyPicker}
        origin={TokenPickerOrigin.Send}
        onTokenSelected={onTokenSelected}
        onClose={closeCurrencyPicker}
      />
    </>
  )
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
  },
})

export default SendAmountHeader

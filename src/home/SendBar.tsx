import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes } from 'src/components/Button'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import { canSendTokensSelector } from 'src/send/selectors'
import colors from 'src/styles/colors'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'

interface Props {
  selectedTokenId?: string
}

export default function SendBar({ selectedTokenId }: Props) {
  const canSendTokens = useSelector(canSendTokensSelector)
  const tokenInfo = useTokenInfo(selectedTokenId)

  const onPressSend = () => {
    navigate(Screens.SendSelectRecipient, {
      defaultTokenIdOverride: tokenInfo?.tokenId,
      forceTokenId: !!tokenInfo?.tokenId,
    })
    ValoraAnalytics.track(FiatExchangeEvents.cico_non_celo_exchange_send_bar_continue)
  }

  const { t } = useTranslation()

  return (
    <View style={styles.container} testID="SendBar">
      <Button
        style={styles.button}
        size={BtnSizes.MEDIUM}
        text={t('send')}
        onPress={onPressSend}
        disabled={!canSendTokens}
        testID="SendBar/SendButton"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: variables.contentPadding,
    paddingVertical: 12,
    borderTopColor: colors.gray2,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    flexDirection: 'column',
  },
})

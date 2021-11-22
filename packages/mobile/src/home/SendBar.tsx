import Button, { BtnSizes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import variables from '@celo/react-components/styles/variables'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'

interface Props {
  selectedCurrency?: Currency
  skipImport?: boolean
}

export default function SendBar({ selectedCurrency, skipImport }: Props) {
  const onPressSend = () => {
    navigate(Screens.Send, { skipContactsImport: skipImport, forceCurrency: selectedCurrency })
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

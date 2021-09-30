import Button, { BtnSizes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import variables from '@celo/react-components/styles/variables'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

export default function SendBar() {
  const onPressSend = () => {
    // TODO: Add Analytics
    // ValoraAnalytics.track()
    navigate(Screens.Send)
  }

  const { t } = useTranslation(Namespaces.sendFlow7)

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

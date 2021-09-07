import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, StyleSheet, TextStyle } from 'react-native'
import { AnalyticsEventType } from 'src/analytics/Events'
import { Namespaces } from 'src/i18n'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton, TopBarTextButton } from 'src/navigator/TopBarButton'

interface Props {
  onCancel?: () => void
  style?: StyleProp<TextStyle>
  eventName?: AnalyticsEventType
  buttonType?: String
}

export default function CancelButton({ eventName, onCancel, style, buttonType = 'text' }: Props) {
  function onPressCancel() {
    if (onCancel) {
      onCancel()
    } else {
      navigateBack()
    }
  }

  const { t } = useTranslation(Namespaces.global)
  return buttonType !== 'icon' ? (
    <TopBarTextButton
      testID="CancelButton"
      onPress={onPressCancel}
      titleStyle={style ? [styles.title, style] : styles.title}
      title={t('cancel')}
      eventName={eventName}
    />
  ) : (
    <TopBarIconButton
      testID="CancelButton"
      onPress={onPressCancel}
      eventName={eventName}
      icon={<Times />}
    />
  )
}

const styles = StyleSheet.create({
  title: {
    color: colors.dark,
    paddingHorizontal: 0,
  },
})

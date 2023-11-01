import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, StyleSheet, TextStyle } from 'react-native'
import { AnalyticsEventType } from 'src/analytics/Properties'
import Times from 'src/icons/Times'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton, TopBarTextButton } from 'src/navigator/TopBarButton'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

interface Props {
  onCancel?: () => void
  style?: StyleProp<TextStyle>
  eventName?: AnalyticsEventType
  buttonType?: 'text' | 'icon'
}

export default function ImportTokenButton({
  eventName,
  onCancel,
  style,
  buttonType = 'text',
}: Props) {
  function onPressCancel() {
    if (onCancel) {
      onCancel()
    } else {
      navigateBack()
    }
  }

  const { t } = useTranslation()
  return buttonType !== 'icon' ? (
    <TopBarTextButton
      testID="ImportTokenButton"
      onPress={onPressCancel}
      titleStyle={style ? [styles.title, style] : styles.title}
      title={t('importToken')}
      eventName={eventName}
    />
  ) : (
    <TopBarIconButton
      testID="ImportTokenButton"
      onPress={onPressCancel}
      eventName={eventName}
      icon={<Times />}
    />
  )
}

const styles = StyleSheet.create({
  title: {
    ...typeScale.labelMedium,
    color: Colors.greenUI,
    paddingRight: 8,
  },
})

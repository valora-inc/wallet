import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { notificationSpotlightSeen } from 'src/app/actions'
import Button, { BtnSizes } from 'src/components/Button'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import NotificationBell from 'src/home/NotificationBell'
import { useDispatch } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  isVisible: boolean
}

const VERTICAL_TOP_BAR_OFFSET = 4
const HORIZONTAL_TOP_BAR_OFFSET = 4
const SPOTLIGHT_SIZE = 48
const ARROW_SIZE = 8

// Note: this component should not be repurposed for other spotlights, it is
// dependent on the position of the notification bell and the layout will break
// if real notification bell position changes.
export default function NotificationBellSpotlight({ isVisible }: Props) {
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const [isDisplayed, setIsDisplayed] = useState(isVisible)
  const progress = useSharedValue(0)
  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: 1 * progress.value,
  }))

  useShowOrHideAnimation(
    progress,
    isVisible,
    () => {
      setIsDisplayed(true)
    },
    () => {
      setIsDisplayed(false)
    }
  )

  const handleDismiss = () => {
    dispatch(notificationSpotlightSeen())
    ValoraAnalytics.track(HomeEvents.notification_center_spotlight_dismiss)
  }

  if (!isDisplayed) {
    return null
  }

  return (
    <Animated.View style={[styles.background, animatedOpacity]}>
      <View style={[styles.bellContainer, { top: insets.top + VERTICAL_TOP_BAR_OFFSET }]}>
        <NotificationBell />
      </View>
      <View
        style={[styles.arrow, { top: insets.top + VERTICAL_TOP_BAR_OFFSET + SPOTLIGHT_SIZE }]}
      />
      <View
        style={[
          styles.messageContainer,
          { top: insets.top + VERTICAL_TOP_BAR_OFFSET + SPOTLIGHT_SIZE + ARROW_SIZE * 2 },
        ]}
      >
        <Text style={styles.messageText}>{t('notificationCenterSpotlight.message')}</Text>
        <Button
          onPress={handleDismiss}
          text={t('notificationCenterSpotlight.cta')}
          touchableStyle={styles.buttonTouchable}
          style={styles.button}
          size={BtnSizes.SMALL}
        />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${Colors.black}CC`, // 80% opacity
  },
  bellContainer: {
    borderRadius: 100,
    position: 'absolute',
    height: SPOTLIGHT_SIZE,
    width: SPOTLIGHT_SIZE,
    right: HORIZONTAL_TOP_BAR_OFFSET,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  arrow: {
    position: 'absolute',
    right: Spacing.Regular16 + HORIZONTAL_TOP_BAR_OFFSET,
    width: 0,
    height: 0,
    borderWidth: ARROW_SIZE,
    borderColor: 'transparent',
    borderBottomColor: Colors.white,
  },
  messageContainer: {
    width: '75%',
    position: 'absolute',
    right: HORIZONTAL_TOP_BAR_OFFSET,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.Regular16,
  },
  messageText: {
    ...fontStyles.small,
    marginBottom: Spacing.Small12,
  },
  buttonTouchable: {
    minWidth: 64,
  },
  button: {
    alignSelf: 'flex-end',
  },
})

import { debounce } from 'lodash'
import React, { ReactNode, useCallback } from 'react'
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import Touchable from 'src/components/Touchable'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

const BUTTON_TAP_DEBOUNCE_TIME = 300 // milliseconds
const DEBOUNCE_OPTIONS = {
  leading: true,
  trailing: false,
}

export enum BtnTypes {
  BRAND_PRIMARY = 'BrandPrimary',
  BRAND_SECONDARY = 'BrandSecondary',
  PRIMARY = 'Primary',
  PRIMARY2 = 'Primary2',
  SECONDARY = 'Secondary',
  TERTIARY = 'Tertiary',
  ONBOARDING = 'Onboarding',
  ONBOARDING_SECONDARY = 'OnboardingSecondary',
  NOTIFICATION = 'Notification',
  NOTIFICATION_SECONDARY = 'NotificationSecondary',
}

export enum BtnSizes {
  TINY = 'tiny',
  SMALL = 'small',
  MEDIUM = 'medium',
  FULL = 'full',
}

export interface ButtonProps {
  onPress: () => void
  style?: StyleProp<ViewStyle>
  text: string | ReactNode
  showLoading?: boolean
  loadingColor?: string
  accessibilityLabel?: string
  type?: BtnTypes
  icon?: ReactNode
  rounded?: boolean
  disabled?: boolean
  size?: BtnSizes
  testID?: string
}

export default React.memo(function Button(props: ButtonProps) {
  const {
    accessibilityLabel,
    disabled,
    size,
    testID,
    text,
    icon,
    type = BtnTypes.PRIMARY,
    rounded = true,
    style,
    showLoading,
    loadingColor,
  } = props

  // Debounce onPress event so that it is called once on trigger and
  // consecutive calls in given period are ignored.
  const debouncedOnPress = useCallback(
    debounce(props.onPress, BUTTON_TAP_DEBOUNCE_TIME, DEBOUNCE_OPTIONS),
    [props.onPress, disabled]
  )

  const { textColor, backgroundColor, opacity } = getColors(type, disabled)

  return (
    <View style={getStyleForWrapper(size, style)}>
      {/* these Views cannot be combined as it will cause ripple to not respect the border radius */}
      <View style={[styles.containRipple, rounded && styles.rounded]}>
        <Touchable
          onPress={debouncedOnPress}
          disabled={disabled}
          style={getStyle(size, backgroundColor, opacity)}
          testID={testID}
        >
          {showLoading ? (
            <ActivityIndicator size="small" color={loadingColor ?? textColor} />
          ) : (
            <>
              {icon}
              <Text
                maxFontSizeMultiplier={1}
                accessibilityLabel={accessibilityLabel}
                style={{ ...getFontStyle(size), color: textColor }}
              >
                {text}
              </Text>
            </>
          )}
        </Touchable>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  // on android Touchable Provides a ripple effect, by itself it does not respect the border radius on Touchable
  containRipple: {
    overflow: 'hidden',
  },
  rounded: {
    borderRadius: 100,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPadding: {
    paddingVertical: 5,
    paddingHorizontal: 24,
  },
  tiny: {
    height: 28,
    minWidth: 32,
    paddingVertical: 3,
    paddingHorizontal: 16,
  },
  small: {
    height: 40,
    minWidth: 120,
  },
  medium: {
    height: 48,
    minWidth: 120,
  },
  full: {
    height: 48,
    flexGrow: 1,
  },
})

function getFontStyle(size: BtnSizes | undefined) {
  let fontStyle
  switch (size) {
    case BtnSizes.SMALL || BtnSizes.TINY: {
      fontStyle = { ...fontStyles.small }
      break
    }
    default: {
      fontStyle = { ...fontStyles.regular600 }
      break
    }
  }
  return { ...fontStyle }
}

function getColors(type: BtnTypes, disabled: boolean | undefined) {
  let textColor
  let backgroundColor
  let opacity
  switch (type) {
    case BtnTypes.BRAND_PRIMARY:
      textColor = colors.light
      backgroundColor = disabled ? colors.orangeFaint : colors.orangeBrand
      break
    case BtnTypes.BRAND_SECONDARY:
      textColor = colors.light
      backgroundColor = disabled ? colors.greenFaint : colors.greenBrand
      break
    case BtnTypes.PRIMARY:
      textColor = colors.light
      backgroundColor = disabled ? colors.orangeFaint : colors.orangeUI
      break
    case BtnTypes.PRIMARY2:
      textColor = colors.light
      backgroundColor = disabled ? colors.greenFaint : colors.greenUI
      break
    case BtnTypes.SECONDARY:
      textColor = disabled ? colors.gray4 : colors.dark
      backgroundColor = colors.beige
      break
    case BtnTypes.TERTIARY:
      textColor = colors.light
      backgroundColor = disabled ? colors.goldFaint : colors.goldUI
      break
    case BtnTypes.ONBOARDING:
      textColor = colors.light
      backgroundColor = colors.onboardingGreen
      opacity = disabled ? 0.5 : 1.0
      break
    case BtnTypes.ONBOARDING_SECONDARY:
      textColor = colors.onboardingGreen
      backgroundColor = colors.light
      opacity = disabled ? 0.5 : 1.0
      break
    case BtnTypes.NOTIFICATION:
      textColor = colors.light
      backgroundColor = colors.notificationButton
      opacity = disabled ? 0.5 : 1.0
      break
    case BtnTypes.NOTIFICATION_SECONDARY:
      textColor = colors.notificationButton
      backgroundColor = colors.light
      opacity = disabled ? 0.5 : 1.0
      break
  }

  return { textColor, backgroundColor, opacity }
}

function getStyle(
  size: BtnSizes | undefined,
  backgroundColor: Colors,
  opacity: number | undefined
) {
  switch (size) {
    case BtnSizes.TINY:
      return {
        ...styles.button,
        ...styles.buttonPadding,
        ...styles.tiny,
        backgroundColor,
        opacity,
      }
    case BtnSizes.SMALL:
      return {
        ...styles.button,
        ...styles.buttonPadding,
        ...styles.small,
        backgroundColor,
        opacity,
      }
    case BtnSizes.FULL:
      return {
        ...styles.button,
        ...styles.buttonPadding,
        ...styles.full,
        backgroundColor,
        opacity,
      }
    default:
      return {
        ...styles.button,
        ...styles.buttonPadding,
        ...styles.medium,
        backgroundColor,
        opacity,
      }
  }
}

function getStyleForWrapper(
  size: BtnSizes | undefined,
  style: StyleProp<ViewStyle>
): StyleProp<ViewStyle> {
  return [{ flexDirection: size === BtnSizes.FULL ? 'column' : 'row' }, style]
}

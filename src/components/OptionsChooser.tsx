// This component shows the native Action Sheet on iOS to let a user choose between different options
// or shows a modal with the options on Android.

import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionSheetIOS, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Modal from 'src/components/Modal'
import colors from 'src/styles/colors'
import fontStyles, { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  isVisible: boolean
  options: string[]
  includeCancelButton: boolean
  isLastOptionDestructive: boolean
  buttonsColor?: string
  onOptionChosen: (optionIndex: number) => void
  onCancel?: () => void
}

function OptionsChooser({
  isVisible,
  options,
  includeCancelButton,
  isLastOptionDestructive,
  buttonsColor = colors.primary,
  onOptionChosen,
  onCancel,
}: Props) {
  const { t } = useTranslation()
  const fullOptions = includeCancelButton ? [...options, t('cancel')] : options
  const cancelButtonIndex = includeCancelButton ? fullOptions.length - 1 : undefined
  const destructiveButtonIndex = isLastOptionDestructive
    ? (cancelButtonIndex || options.length) - 1
    : undefined

  useEffect(() => {
    if (Platform.OS === 'ios' && isVisible) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: fullOptions,
          cancelButtonIndex,
          destructiveButtonIndex,
          tintColor: buttonsColor,
        },
        (buttonIndex) => {
          if (buttonIndex === cancelButtonIndex) {
            onCancel?.()
          } else {
            onOptionChosen(buttonIndex)
          }
        }
      )
    }
  }, [isVisible])

  if (Platform.OS === 'ios') {
    return null
  }

  const onItemPressed = (buttonIndex: number) => async () => {
    if (buttonIndex === cancelButtonIndex) {
      await onCancel?.()
    } else {
      await onOptionChosen(buttonIndex)
    }
  }

  return (
    <Modal isVisible={isVisible} style={styles.container}>
      {fullOptions.map((option, index) => {
        const extraStyles = {
          ...(index === cancelButtonIndex ? fontStyles.large600 : typeScale.bodyLarge),
          color: index === destructiveButtonIndex ? colors.error : buttonsColor,
        }
        return (
          <>
            {index > 0 && (
              <View
                key={`separator-${option}`}
                style={[
                  styles.separator,
                  index === cancelButtonIndex ? styles.cancelSeparator : {},
                ]}
              />
            )}
            <TouchableOpacity key={option} onPress={onItemPressed(index)}>
              <Text style={[styles.option, extraStyles]}>{option}</Text>
            </TouchableOpacity>
          </>
        )
      })}
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  option: {
    marginVertical: Spacing.Regular16,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: colors.gray2,
  },
  cancelSeparator: {
    backgroundColor: colors.gray3,
  },
})

export default OptionsChooser

import GorhomBottomSheet, { BottomSheetProps } from '@gorhom/bottom-sheet'
import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ScrollView } from 'react-native-gesture-handler'
import BottomSheetBase from 'src/components/BottomSheetBase'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import Touchable from 'src/components/Touchable'
import Checkmark from 'src/icons/Checkmark'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const OPTION_HEIGHT = 60
const MAX_OPTIONS_IN_VIEW = 5

interface MultiSelectBottomSheetProps<T extends string> {
  forwardedRef: React.RefObject<GorhomBottomSheet>
  onChange?: BottomSheetProps['onChange']
  onClose?: () => void
  onOpen?: () => void
  handleComponent?: BottomSheetProps['handleComponent']
  options: Option[]
  selectedOptions: Option[]
  setSelectedOptions: (selectedOptions: Option[]) => void
  selectAllText: string
  title: string
}

export interface Option {
  id: string
  text: string
  iconUrl?: string
}

function MultiSelectBottomSheet<T extends string>({
  forwardedRef,
  onClose,
  onOpen,
  options,
  setSelectedOptions,
  selectedOptions,
  selectAllText,
  title,
}: MultiSelectBottomSheetProps<T>) {
  const { t } = useTranslation()
  const scrollViewRef = useRef<ScrollView>(null)

  const isEveryOptionSelected = options.length === selectedOptions.length

  const handleClose = () => {
    onClose?.()
  }

  return (
    <BottomSheetBase
      forwardedRef={forwardedRef}
      onClose={handleClose}
      onOpen={onOpen}
      backgroundStyle={{ backgroundColor: 'transparent' }}
      handleIndicatorStyle={{ width: 0 }}
    >
      <BottomSheetScrollView
        forwardedRef={scrollViewRef}
        testId={'MultiSelectBottomSheet'}
        containerStyle={styles.bottomSheetScrollView}
      >
        <View style={[styles.option, styles.borderRadiusTop]}>
          <Text style={styles.boldTextStyle}>{title}</Text>
        </View>
        <View style={styles.optionsContainer}>
          <ScrollView style={{ height: OPTION_HEIGHT * MAX_OPTIONS_IN_VIEW }}>
            <Option
              text={selectAllText}
              isSelected={isEveryOptionSelected}
              onPress={() => setSelectedOptions(options)}
            />
            {options.map((option) => (
              <Option
                text={option.text}
                iconUrl={option.iconUrl}
                isSelected={
                  !!selectedOptions.find((selectedOption) => selectedOption.id === option.id) &&
                  !isEveryOptionSelected
                }
                onPress={() => {
                  if (isEveryOptionSelected) {
                    setSelectedOptions([option])
                  } else {
                    if (selectedOptions.find((selectedOption) => selectedOption.id === option.id)) {
                      setSelectedOptions(
                        selectedOptions.filter((selectedOption) => selectedOption.id !== option.id)
                      )
                    } else {
                      setSelectedOptions([...selectedOptions, option])
                    }
                  }
                }}
              />
            ))}
          </ScrollView>
        </View>
        <View style={styles.doneButtonContainer}>
          <Touchable
            testID="MultiSelectBottomSheet/Done"
            style={styles.doneButton}
            onPress={handleClose}
          >
            <Text style={styles.boldTextStyle}>{t('done')}</Text>
          </Touchable>
        </View>
      </BottomSheetScrollView>
    </BottomSheetBase>
  )
}

interface OptionProps {
  onPress?: () => void
  text: string
  isSelected: boolean
  iconUrl?: string
}
function Option({ onPress, text, iconUrl, isSelected }: OptionProps) {
  return (
    <View key={text} style={styles.optionContainer}>
      <Touchable style={styles.option} onPress={onPress}>
        <View style={styles.optionRow}>
          <View style={styles.leftColumn}>
            <FastImage source={{ uri: iconUrl }} style={styles.icon} testID={`${text}-icon`} />
          </View>
          <View style={styles.centerColumn}>
            <Text numberOfLines={1} style={styles.textStyle}>
              {text}
            </Text>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.checkMarkContainer}>
              {isSelected && (
                <Checkmark
                  testID={`${text}-checkmark`}
                  color={Colors.black}
                  height={24}
                  width={24}
                />
              )}
            </View>
          </View>
        </View>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  doneButton: {
    borderRadius: 16,
    backgroundColor: Colors.white,
    height: 56,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: Spacing.Thick24,
  },
  doneButtonContainer: {
    flexDirection: 'column',
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  leftColumn: {
    alignItems: 'flex-start',
    width: 32,
  },
  centerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  rightColumn: {
    width: 32,
    alignItems: 'flex-end',
  },
  checkMarkContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  optionContainer: {
    flexDirection: 'column',
  },
  option: {
    height: OPTION_HEIGHT,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: Spacing.Thick24,
    borderTopWidth: 1,
    borderColor: Colors.gray2,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  borderRadiusTop: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: Colors.white,
  },
  optionsContainer: {
    flexDirection: 'column',
    marginBottom: Spacing.Smallest8,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  textStyle: {
    ...typeScale.bodyLarge,
  },
  boldTextStyle: {
    ...typeScale.labelSemiBoldLarge,
  },
  bottomSheetScrollView: {
    marginHorizontal: Spacing.Regular16,
    padding: 0,
  },
})

export default MultiSelectBottomSheet

import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import DownArrowIcon from 'src/icons/DownArrowIcon'
import UpArrowIcon from 'src/icons/UpArrowIcon'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props<T> {
  options: { value: T; label: string }[]
  onValueSelected(value: T): void
  testId?: string
}

/* Dropdown component with unscrollable list of options */

function Dropdown<T>(props: Props<T>) {
  const testID = props.testId ? props.testId : 'Dropdown'
  const [isOpen, setIsOpen] = useState(false)
  const [labelSelected, setLabelSelected] = useState<string | undefined>()

  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }

  return (
    <View style={{ zIndex: 100 }} testID={testID}>
      <Touchable onPress={toggleOpen} testID={testID + '-Touchable'}>
        <View style={styles.selectedOptionContainer}>
          <Text style={styles.optionText}>{labelSelected}</Text>
          {!isOpen ? (
            <DownArrowIcon color={Colors.primary} strokeWidth={2} />
          ) : (
            <UpArrowIcon color={Colors.primary} strokeWidth={2} />
          )}
        </View>
      </Touchable>
      {isOpen && (
        <View>
          <View style={styles.optionsContainer}>
            {props.options.map((option) => {
              return (
                <Touchable
                  style={{ padding: Spacing.Small12 }}
                  onPress={() => {
                    setLabelSelected(option.label)
                    toggleOpen()
                    props.onValueSelected(option.value)
                  }}
                  testID={testID + '-' + option.label}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                </Touchable>
              )
            })}
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  dropdownContainer: {},
  selectedOptionContainer: {
    padding: Spacing.Small12,
    borderColor: Colors.gray2,
    borderRadius: Spacing.Tiny4,
    borderWidth: 1.5,
    gap: Spacing.Thick24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionsContainer: {
    position: 'absolute',
    top: 0,
    zIndex: 100,
    borderColor: Colors.gray2,
    borderRadius: Spacing.Tiny4,
    borderWidth: 1.5,
    backgroundColor: Colors.white,
    flexDirection: 'column',
    width: '100%',
  },
  optionText: {
    ...typeScale.bodyMedium,
    flexGrow: 1,
  },
})

export default Dropdown

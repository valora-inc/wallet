import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import { Spacing } from 'src/styles/styles'

interface Props {
  values: string[]
  selectedIndex: number
  onChange: (value: string, selectedIndex: number) => void
}

function SegmentedControl({ values, selectedIndex, onChange }: Props) {
  const handleSelectOption = (value: string, index: number) => () => {
    onChange(value, index)
    vibrateInformative()
  }

  return (
    <View style={styles.container} testID="TokenBalances/SegmentedControl">
      {values.map((value, index) => (
        <Touchable
          key={value}
          style={[
            styles.button,
            { backgroundColor: index === selectedIndex ? Colors.accent : Colors.gray1 },
            // Round the left and right sides of the first and last buttons respectively
            index === 0 && { borderBottomEndRadius: 0, borderTopEndRadius: 0 },
            index === values.length - 1 && { borderBottomStartRadius: 0, borderTopStartRadius: 0 },
            // Square corners, no border radius, for middle buttons
            index !== 0 && index !== values.length - 1 && { borderRadius: 0 },
          ]}
          onPress={handleSelectOption(value, index)}
        >
          <Text
            style={[styles.text, { color: index === selectedIndex ? Colors.white : Colors.gray4 }]}
          >
            {value}
          </Text>
        </Touchable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flexDirection: 'row',
    borderRadius: 100,
    backgroundColor: Colors.gray1,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    paddingVertical: Spacing.Smallest8,
  },
  text: {
    ...typeScale.labelSemiBoldSmall,
  },
})

export default SegmentedControl

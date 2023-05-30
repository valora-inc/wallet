import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
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
            { backgroundColor: index === selectedIndex ? Colors.greenUI : Colors.gray1 },
          ]}
          onPress={handleSelectOption(value, index)}
        >
          <Text
            style={[styles.text, { color: index === selectedIndex ? Colors.light : Colors.gray4 }]}
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
    ...fontStyles.small600,
  },
})

export default SegmentedControl

import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

interface Props {
  values: string[]
  selectedIndex: number
  onChange: (value: string, selectedIndex: number) => void
}

function SegmentedControl({ values, selectedIndex, onChange }: Props) {
  const handleSelectOption = (value: string, index: number) => () => {
    onChange(value, index)
  }

  return (
    <View style={styles.container}>
      {values.map((value, index) => (
        <Touchable
          style={[
            styles.button,
            index === selectedIndex ? { backgroundColor: Colors.greenUI } : {},
          ]}
          onPress={handleSelectOption(value, index)}
        >
          <Text style={[styles.text, index === selectedIndex ? { color: Colors.light } : {}]}>
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
    height: 32,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  text: {
    ...fontStyles.small600,
    color: Colors.gray4,
  },
})

export default SegmentedControl

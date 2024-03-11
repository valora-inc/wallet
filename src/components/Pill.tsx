import React from 'react'
import { StyleSheet, Text } from 'react-native'
import Touchable from 'src/components/Touchable'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

interface Props {
  text: string
  icon?: React.ReactNode
  onPress: () => void
  testID?: string
  textColor?: string
}

function Pill({ text, icon, onPress, testID, textColor }: Props) {
  return (
    <Touchable style={styles.container} onPress={onPress} testID={testID}>
      <>
        {icon}
        <Text
          style={[
            styles.text,
            { color: textColor ?? colors.primary },
            icon ? { marginLeft: 5 } : {},
          ]}
        >
          {text}
        </Text>
      </>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: colors.successLight,
  },
  text: {
    ...typeScale.labelSemiBoldSmall,
  },
})

export default Pill

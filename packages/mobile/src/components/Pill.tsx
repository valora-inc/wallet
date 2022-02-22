import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import React from 'react'
import { StyleSheet, Text } from 'react-native'

interface Props {
  text: string
  icon?: React.ReactNode
  onPress: () => void
  testID?: string
}

function Pill({ text, icon, onPress, testID }: Props) {
  return (
    <Touchable style={styles.container} onPress={onPress} testID={testID}>
      <>
        {icon}
        <Text style={[styles.text, icon ? { marginLeft: 5 } : {}]}>{text}</Text>
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
    backgroundColor: colors.greenBackground,
  },
  text: {
    ...fontStyles.small600,
    color: colors.greenUI,
  },
})

export default Pill

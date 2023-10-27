import React, { ReactElement } from 'react'
import { View, StyleSheet, Text } from 'react-native'
import Touchable from 'src/components/Touchable'
import CircledIcon from 'src/icons/CircledIcon'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

type Props = {
  title: string
  subtitle: string
  onPress: () => void
  icon: ReactElement
  testID: string
}

function SelectRecipientButton({ title, subtitle, onPress, icon, testID }: Props) {
  return (
    <Touchable testID={testID} onPress={onPress} style={styles.container}>
      <View style={styles.body}>
        <CircledIcon radius={40} style={styles.icon} backgroundColor={colors.gray1}>
          {icon}
        </CircledIcon>
        <View style={styles.textSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  icon: {
    borderWidth: 1,
    borderColor: colors.gray2,
  },
  subtitle: {
    ...typeScale.bodySmall,
    color: colors.gray3,
  },
  title: {
    ...typeScale.labelMedium,
    color: colors.dark,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textSection: {
    paddingLeft: 15,
    flexDirection: 'column',
  },
})

export default SelectRecipientButton

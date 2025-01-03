import React, { ReactElement } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import Checkmark from 'src/icons/Checkmark'
import CircledIcon from 'src/icons/CircledIcon'
import GradientIcon from 'src/icons/GradientIcon'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

type Props = {
  title: string
  subtitle: string
  onPress: () => void
  icon: ReactElement
  gradientBackground?: boolean
  testID: string
  showCheckmark?: boolean
}

function SelectRecipientButton({
  title,
  subtitle,
  onPress,
  icon,
  gradientBackground,
  testID,
  showCheckmark,
}: Props) {
  return (
    <Touchable testID={testID} onPress={onPress} style={styles.container}>
      <View style={styles.body}>
        {gradientBackground ? (
          <GradientIcon radius={40}>{icon}</GradientIcon>
        ) : (
          <CircledIcon radius={40} style={styles.icon} backgroundColor={colors.gray1}>
            {icon}
          </CircledIcon>
        )}
        {showCheckmark && (
          <View style={styles.checkmark} testID={`${testID}/checkmark`}>
            <Checkmark height={12} width={12} color={colors.black} />
          </View>
        )}
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
    paddingVertical: Spacing.Regular16,
    paddingHorizontal: Spacing.Regular16,
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
    color: colors.black,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textSection: {
    paddingLeft: Spacing.Small12,
    flexDirection: 'column',
    flex: 1,
  },
  checkmark: {
    position: 'absolute',
    left: 26,
    top: 26,
    backgroundColor: colors.gray2,
    borderRadius: 100,
    padding: 2,
  },
})

export default SelectRecipientButton

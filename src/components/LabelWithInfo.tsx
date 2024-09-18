import React from 'react'
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native'
import Touchable from 'src/components/Touchable'

import InfoIcon from 'src/icons/InfoIcon'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export function LabelWithInfo({
  label,
  onPress,
  labelStyle,
  iconSize = 16,
  testID,
}: {
  label: string
  onPress?: () => void
  labelStyle?: StyleProp<TextStyle>
  iconSize?: number
  testID?: string
}) {
  return (
    <Touchable testID={testID} style={styles.txDetailsLabel} onPress={onPress} disabled={!onPress}>
      <>
        <Text style={[styles.txDetailsLabelText, labelStyle]} numberOfLines={1}>
          {label}
        </Text>
        {onPress && <InfoIcon size={iconSize} color={Colors.gray3} />}
      </>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  txDetailsLabel: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.Tiny4,
    alignItems: 'center',
    paddingRight: 20, // Prevents Icon from being cut off on long labels
    minWidth: '25%',
    color: Colors.gray3,
  },
  txDetailsLabelText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    flexWrap: 'wrap',
    textAlign: 'left',
  },
})

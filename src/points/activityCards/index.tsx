import React from 'react'
import Touchable from 'src/components/Touchable'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { StyleSheet, Text, View } from 'react-native'
import { Colors } from 'src/styles/colors'
import CheckmarkWithCircleBorder from 'src/icons/CheckmarkWithCircleBorder'

interface Props {
  completed: boolean
  icon: React.ReactNode
  title: string
  testID?: string
  points?: number
  onCardPress?: () => void
}

export default function ActivityCard({ completed, icon, title, onCardPress, testID }: Props) {
  const containerStyle = {
    ...styles.cardContainer,
    ...(completed ? { opacity: 0.5 } : {}),
  }

  const content = (
    <View style={containerStyle}>
      {completed && (
        <View style={styles.checkmarkIcon}>
          <CheckmarkWithCircleBorder />
        </View>
      )}
      {icon}
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  )
  if (onCardPress) {
    return (
      <Touchable testID={testID} style={styles.container} onPress={onCardPress}>
        {content}
      </Touchable>
    )
  } else {
    return (
      <View testID={testID} style={styles.container}>
        {content}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexBasis: 0,
    borderRadius: Spacing.Regular16,
    margin: Spacing.Smallest8,
    backgroundColor: Colors.gray1,
    height: 96,
  },
  checkmarkIcon: {
    position: 'absolute',
    top: Spacing.Smallest8,
    right: 0,
  },
  cardTitle: {
    ...typeScale.labelXSmall,
    textAlign: 'center',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.Regular16,
  },
})

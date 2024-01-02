import React from 'react'
import { StyleSheet, View } from 'react-native'
import TextButton from 'src/components/TextButton'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export interface CallToAction {
  onPress: (params?: { index?: number }) => unknown
  text: string | React.ReactNode
  dim?: boolean
  isSecondary?: boolean
}

interface Props {
  callToActions: CallToAction[]
  testID?: string
  positionInNotificationList?: number
}

export default function CallToActionsBar({
  callToActions,
  testID,
  positionInNotificationList,
}: Props) {
  return (
    <View style={styles.container} testID={testID}>
      {callToActions.map((cta, i) => {
        if (typeof cta.text === 'string') {
          return (
            <TextButton
              testID={`${testID}/${cta.text}/Button`}
              key={i}
              style={{
                ...styles.action,
                ...(cta.isSecondary ? styles.secondaryAction : {}),
              }}
              onPress={() => cta.onPress({ index: positionInNotificationList })}
            >
              {cta.text}
            </TextButton>
          )
        }
        return (
          <View key={i} style={styles.action}>
            {cta.text}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  action: {
    ...typeScale.labelXSmall,
    marginRight: Spacing.Thick24,
    minWidth: Spacing.XLarge48,
    minHeight: Spacing.Regular16,
  },
  secondaryAction: {
    color: Colors.gray3,
  },
})

import React from 'react'
import { StyleSheet, View } from 'react-native'
import TextButton from 'src/components/TextButton'
import colors from 'src/styles/colors'

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
    fontSize: 14,
    lineHeight: 16,
    marginRight: 24,
    minWidth: 48,
    minHeight: 16,
  },
  secondaryAction: {
    color: colors.gray4,
  },
})

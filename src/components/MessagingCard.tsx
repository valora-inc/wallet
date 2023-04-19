import React from 'react'
import { StyleSheet } from 'react-native'
import Card, { Props } from 'src/components/Card'
import Colors from 'src/styles/colors'

// Card used by all messaging cards
export default function MessagingCard({ style, ...props }: Props) {
  return <Card style={[styles.container, style]} shadow={null} rounded={true} {...props} />
}

const styles = StyleSheet.create({
  container: {
    minHeight: 144,
    flex: 1,
    // NOTE: using this over bar shadow since it's barely visible on android. If we
    // want to use this consistently everywhere (this is TBD from design), this
    // can be pulled into the Card component
    borderColor: Colors.gray2,
    borderWidth: 1,
  },
})

import React from 'react'
import { StyleSheet } from 'react-native'
import Card, { Props } from 'src/components/Card'

// Card used by all messaging cards
export default function MessagingCard({ style, ...props }: Props) {
  return <Card style={[styles.container, style]} rounded={true} {...props} />
}

const styles = StyleSheet.create({
  container: {
    minHeight: 144,
    flex: 1,
  },
})

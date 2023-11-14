import React from 'react'
import { StyleSheet } from 'react-native'
import Button, { BtnSizes } from 'src/components/Button'
import variables from 'src/styles/variables'

interface Props {
  hidden: boolean
  disabled: boolean
  text: string
  onPress: () => void
}

export default function SendOrInviteButton({ hidden, disabled, text, onPress }: Props) {
  if (hidden) {
    return <></>
  }
  return (
    <Button
      testID="SendOrInviteButton"
      style={styles.button}
      onPress={onPress}
      disabled={disabled}
      text={text}
      size={BtnSizes.FULL}
    />
  )
}

const styles = StyleSheet.create({
  button: {
    padding: variables.contentPadding,
  },
})

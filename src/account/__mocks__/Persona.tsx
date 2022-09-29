import React from 'react'
import { Button } from 'react-native'

const MockPersona = (props: any) => {
  return (
    <Button
      title={'mock Persona button'}
      testID="PersonaButton"
      disabled={props.disabled}
      onPress={props.onPress}
    />
  )
}

export default MockPersona

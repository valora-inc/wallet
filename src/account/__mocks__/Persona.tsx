import React from 'react'
import { Button } from 'react-native'

const MockPersona = (props: any) => {
  return (
    <>
      <Button
        title={'mock Persona button'}
        testID="PersonaButton"
        disabled={props.disabled}
        onPress={props.onPress}
      />
      <Button
        title={'mock Persona success'}
        testID="PersonaSuccessButton"
        disabled={props.disabled}
        onPress={props.onSuccess}
      />
      <Button
        title={'mock Persona error'}
        testID="PersonaErrorButton"
        disabled={props.disabled}
        onPress={props.onError}
      />
      <Button
        title={'mock Persona cancel'}
        testID="PersonaCancelButton"
        disabled={props.disabled}
        onPress={props.onCanceled}
      />
    </>
  )
}

export default MockPersona

import React from 'react'
import { Button } from 'react-native'

const MockPersona = (props: any) => {
  return <Button title={'mock Persona button'} testID="PersonaButton" /> // onPress not passed thru from props
}

export default MockPersona

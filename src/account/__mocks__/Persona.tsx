import React from 'react'
import { Button, View } from 'react-native'

const MockPersona = (props: any) => {
  return (
    <>
      <View testID="PersonaView"></View>
      <Button
        title={'mock Persona button'}
        testID="PersonaButton"
        onPress={() => {
          console.log('something else')
        }}
      />
    </>
  ) // onPress not passed thru from props
}

export default MockPersona

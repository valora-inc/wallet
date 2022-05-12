import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'

const Stack = createStackNavigator()
const MockedNavigator = ({
  component,
  params = {},
}: {
  component: React.ComponentType<any>
  params?: object
}) => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={'MockedScreen'}>
        <Stack.Screen name="MockedScreen" component={component} initialParams={params} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default MockedNavigator

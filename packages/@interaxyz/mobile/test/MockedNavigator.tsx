import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'

const Stack = createNativeStackNavigator()
const MockedNavigator = ({
  component,
  params = {},
  options = {},
}: {
  component: React.ComponentType<any>
  params?: object
  options?: object
}) => {
  return (
    <BottomSheetModalProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={'MockedScreen'}>
          <Stack.Screen
            name="MockedScreen"
            component={component}
            initialParams={params}
            options={options}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </BottomSheetModalProvider>
  )
}

export default MockedNavigator

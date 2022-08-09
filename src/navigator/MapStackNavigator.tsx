import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import MapScreen from 'src/map/MapScreen'
import { noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'

const MapStack = createStackNavigator()

export default function MapStackNavigator() {
  const { t } = useTranslation()

  return (
    <MapStack.Navigator initialRouteName={Screens.Map}>
      <MapStack.Screen
        name={Screens.Map}
        component={MapScreen}
        options={{ title: t('map.title'), ...noHeader }}
      />
    </MapStack.Navigator>
  )
}

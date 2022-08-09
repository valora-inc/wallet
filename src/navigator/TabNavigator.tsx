import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import React from 'react'
import { useTranslation } from 'react-i18next'
import Pin from 'src/icons/Pin'
import Services from 'src/icons/Services'
import Wallet from 'src/icons/Wallet'
import HomeStackNavigator from 'src/navigator/HomeStackNavigator'
import MapStackNavigator from 'src/navigator/MapStackNavigator'
import { Screens } from 'src/navigator/Screens'
import ServiceStackNavigator from 'src/navigator/ServiceStackNavigator'

const Tabs = createBottomTabNavigator()

export default function TabNavigator() {
  const { t } = useTranslation()
  return (
    <Tabs.Navigator initialRouteName={Screens.WalletHome}>
      <Tabs.Screen
        name={Screens.WalletHome}
        component={HomeStackNavigator}
        options={{ title: t('home'), tabBarIcon: Wallet }}
      />
      <Tabs.Screen
        name={Screens.WalletServices}
        component={ServiceStackNavigator}
        options={{ title: t('services'), tabBarIcon: Services }}
      />
      <Tabs.Screen
        name={Screens.Map}
        component={MapStackNavigator}
        options={{ title: t('map.title'), tabBarIcon: Pin }}
      />
    </Tabs.Navigator>
  )
}

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import React from 'react'
import { useTranslation } from 'react-i18next'
import Support from 'src/account/Support'
import Map from 'src/icons/Map'
import Services from 'src/icons/Services'
import Wallet from 'src/icons/Wallet'
import HomeStackNavigator from 'src/navigator/HomeStackNavigator'
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
        name={Screens.Support}
        component={Support}
        options={{ title: t('map'), tabBarIcon: Map }}
      />
    </Tabs.Navigator>
  )
}

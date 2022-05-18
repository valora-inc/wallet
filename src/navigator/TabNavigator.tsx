import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import React from 'react'
import { useTranslation } from 'react-i18next'
import Support from 'src/account/Support'
import WalletHome from 'src/home/WalletHome'
import { Help } from 'src/icons/navigator/Help'
import { Home } from 'src/icons/navigator/Home'
import Services from 'src/icons/Services'
import { Screens } from 'src/navigator/Screens'
import WalletServices from 'src/services/WalletServices'

const TAG = 'NavigationService'

const Tabs = createBottomTabNavigator()

export default function TabNavigator() {
  const { t } = useTranslation()
  return (
    <Tabs.Navigator initialRouteName={Screens.WalletHome}>
      <Tabs.Screen
        name={Screens.WalletHome}
        component={WalletHome}
        options={{ title: t('home'), tabBarIcon: Home }}
      />
      <Tabs.Screen
        name={Screens.WalletServices}
        component={WalletServices}
        options={{ title: t('services'), tabBarIcon: Services }}
      />
      <Tabs.Screen
        name={Screens.Support}
        component={Support}
        options={{ title: t('help'), tabBarIcon: Help }}
      />
    </Tabs.Navigator>
  )
}

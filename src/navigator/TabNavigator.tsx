import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NativeStackHeaderProps, NativeStackScreenProps } from '@react-navigation/native-stack'
import { omit } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import TabDiscover from 'src/dappsExplorer/TabDiscover'
import TabHome from 'src/home/TabHome'
import Discover from 'src/icons/navigator/Discover'
import Home from 'src/icons/navigator/Home'
import Wallet from 'src/icons/navigator/Wallet'
import { tabHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import TabWallet from 'src/tokens/TabWallet'

const Tab = createBottomTabNavigator()

type Props = NativeStackScreenProps<StackParamList, Screens.TabNavigator>

export default function TabNavigator({ route }: Props) {
  const initialScreen = route.params?.initialScreen ?? Screens.TabHome
  const { t } = useTranslation()

  return (
    <Tab.Navigator
      initialRouteName={initialScreen}
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerTitleAllowFontScaling: false,
        tabBarActiveTintColor: Colors.navigationBottomPrimary,
        tabBarInactiveTintColor: Colors.navigationBottomSecondary,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabBarItem,
        tabBarAllowFontScaling: false,
        tabBarStyle: {
          height: variables.height * 0.1,
          backgroundColor: Colors.backgroundPrimary,
        },
        ...(tabHeader as NativeStackHeaderProps),
      }}
    >
      <Tab.Screen
        name={Screens.TabWallet}
        component={TabWallet}
        options={{
          tabBarLabel: t('bottomTabsNavigator.wallet.tabName') as string,
          tabBarIcon: Wallet,
          tabBarButtonTestID: 'Tab/Wallet',
        }}
      />
      <Tab.Screen
        name={Screens.TabHome}
        component={TabHome}
        options={{
          freezeOnBlur: false,
          lazy: false,
          tabBarLabel: t('bottomTabsNavigator.home.tabName') as string,
          tabBarIcon: Home,
          tabBarButtonTestID: 'Tab/Home',
        }}
      />
      <Tab.Screen
        name={Screens.TabDiscover}
        component={TabDiscover}
        options={{
          tabBarLabel: t('bottomTabsNavigator.discover.tabName') as string,
          tabBarIcon: Discover,
          tabBarButtonTestID: 'Tab/Discover',
          // Special case for the Dapps explorer,
          // so it reloads the list when the user comes back to it
          // Note: we generally want to avoid this as it resets the scroll position (and all other component state)
          // but here it's the right expectation
          popToTopOnBlur: true,
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  label: {
    // prevent overriding the color set by tabBarActiveTintColor and
    // tabBarInactiveTintColor
    ...omit(typeScale.labelSemiBoldSmall, 'color'),
  },
  tabBarItem: {
    paddingVertical: Spacing.Smallest8,
  },
})

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NativeStackHeaderProps, NativeStackScreenProps } from '@react-navigation/native-stack'
import { omit } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { getAppConfig } from 'src/appConfig'
import TabDiscover from 'src/dappsExplorer/TabDiscover'
import TabEarn from 'src/earn/TabEarn'
import TabHome from 'src/home/TabHome'
import Discover from 'src/icons/navigator/Discover'
import Home from 'src/icons/navigator/Home'
import Wallet from 'src/icons/navigator/Wallet'
import { tabHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { TabScreenConfig } from 'src/public/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import TabWallet from 'src/tokens/TabWallet'

const Tab = createBottomTabNavigator()

type Props = NativeStackScreenProps<StackParamList, Screens.TabNavigator>

type TabScreenConfigInternal = TabScreenConfig & {
  screenName: Screens
  options?: {
    freezeOnBlur?: boolean
    lazy?: boolean
  }
}

const DEFAULT_TABS = {
  wallet: {
    name: 'wallet',
    screenName: Screens.TabWallet,
    component: TabWallet,
    icon: Wallet,
    label: (t) => t('bottomTabsNavigator.wallet.tabName'),
    testID: 'Tab/Wallet',
  },
  activity: {
    name: 'activity',
    // TODO: we'll rename this to TabActivity
    screenName: Screens.TabHome,
    component: TabHome,
    icon: Home,
    label: (t) => t('bottomTabsNavigator.home.tabName'),
    testID: 'Tab/Home',
    options: {
      freezeOnBlur: true,
      lazy: true,
    },
  },
  discover: {
    name: 'discover',
    screenName: Screens.TabDiscover,
    component: TabDiscover,
    icon: Discover,
    label: (t) => t('bottomTabsNavigator.discover.tabName'),
    testID: 'Tab/Discover',
  },
  earn: {
    name: 'earn',
    screenName: Screens.TabEarn,
    component: TabEarn,
    icon: Home,
    label: (t) => t('bottomTabsNavigator.earn.tabName'),
    testID: 'Tab/Earn',
  },
} as const satisfies Record<string, TabScreenConfigInternal>

const DEFAULT_SCREENS = [DEFAULT_TABS.wallet, DEFAULT_TABS.activity, DEFAULT_TABS.discover]

export default function TabNavigator({ route }: Props) {
  const { t } = useTranslation()
  const config = getAppConfig()
  const tabsConfig = config.screens?.tabs?.({ defaultTabs: DEFAULT_TABS })

  const screens = tabsConfig?.screens ?? DEFAULT_SCREENS
  const initialScreen = tabsConfig?.initialScreen ?? DEFAULT_TABS.activity.name

  // Find the initial screen config to be sure it's actually in the list
  const initialScreenConfig = screens.find((screen) => screen.name === initialScreen)

  const initialRouteName =
    route.params?.initialScreen ??
    (initialScreenConfig && 'screenName' in initialScreenConfig
      ? initialScreenConfig.screenName
      : initialScreenConfig?.name)

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
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
      {screens.map((screenConfig) => {
        return (
          <Tab.Screen
            key={screenConfig.name}
            name={'screenName' in screenConfig ? screenConfig.screenName : screenConfig.name}
            component={screenConfig.component as React.ComponentType<any>}
            options={{
              ...('options' in screenConfig && screenConfig.options),
              tabBarLabel: screenConfig.label(t),
              tabBarIcon: screenConfig.icon,
              tabBarButtonTestID: screenConfig.testID,
            }}
          />
        )
      })}
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

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import DAppsExplorerScreenSearchFilter from 'src/dappsExplorer/DAppsExplorerScreenSearchFilter'
import WalletHome from 'src/home/WalletHome'
import ValoraV from 'src/icons/ValoraV'
import Discover from 'src/icons/navigator/Discover'
import Wallet from 'src/icons/navigator/Wallet'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import AssetsScreen from 'src/tokens/Assets'

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
        tabBarActiveTintColor: Colors.black,
        tabBarInactiveTintColor: Colors.gray3,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabBarItem,
        tabBarAllowFontScaling: false,
        tabBarStyle: {
          height: variables.height * 0.1,
        },
      }}
    >
      <Tab.Screen
        name={Screens.TabWallet}
        component={AssetsScreen}
        options={{
          tabBarLabel: t('bottomTabsNavigator.wallet.tabName') as string,
          tabBarIcon: Wallet,
        }}
        initialParams={{ isWalletTab: true }}
      />
      <Tab.Screen
        name={Screens.TabHome}
        component={WalletHome}
        options={{
          freezeOnBlur: false,
          lazy: false,
          tabBarLabel: t('bottomTabsNavigator.home.tabName') as string,
          tabBarIcon: ValoraV,
        }}
        initialParams={{ isTabNavigator: true }}
      />
      <Tab.Screen
        // TODO(act-1106) discover tab screen
        name={Screens.TabDiscover}
        component={DAppsExplorerScreenSearchFilter}
        options={{
          tabBarLabel: t('bottomTabsNavigator.discover.tabName') as string,
          tabBarIcon: Discover,
        }}
      />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  label: {
    ...typeScale.labelSemiBoldSmall,
  },
  tabBarItem: {
    paddingVertical: Spacing.Smallest8,
  },
})
